import { getIp } from './get-ip';
import { notifyProblem } from './notify-problem';
import DefaultPreference from 'react-native-default-preference';
import { IPRangeMatcher } from '../IPRangeMatcher';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { userSettingsRepo } from './db/user-setting.repo';
import { ipRangesRepo } from './db/ip-ranges.repo';
import { logRepo } from './db/log.repo';
import { getDBConnection } from './db/db-service';
import { NetInfoStateType, fetch } from '@react-native-community/netinfo';
import { traceroute } from './traceroute';
import Telephony from 'react-native-telephony-manager';
import { Platform, PermissionsAndroid } from 'react-native';
import GetLocation from 'react-native-get-location';

export type IP = string;

export const compareIP = async (db?: SQLiteDatabase): Promise<boolean> => {
  const state = await fetch();
  if (state.type !== NetInfoStateType.cellular) {
    console.debug('network type', state.type);
    // returning "true" as wiretapping deteciton is not available for Wi-Fi
    return true;
  }

  const cellularGeneration = state.details.cellularGeneration;
  const carrier = state.details.carrier;
  if (!cellularGeneration) {
    cellularGeneration = 'None';
  }
  if (!carrier) {
    carrier = 'Unavailable';
  }

  if (!db) {
    db = await getDBConnection();
  }
  // TODO force 1.1.1.1 and 8.8.8.8. DNS in order to avoid getting the DNS intercepted
  // alternatively, recommend setting 1.1.1.1
  let ip: string = '';
  let errorMessage: string = '';
  try {
    ip = await getIp();
  } catch (ex) {
    console.error(ex);
    errorMessage = ex;
    notifyProblem();
  }

  if (!ip || ip == '') {
    ip = 'Unavailable';
    notifyProblem();
  }

  const userSettings = await userSettingsRepo.getUserSettings(db);
  const ipRanges = await ipRangesRepo.getIpRange(db);
  const ipRangesParsed = ipRanges.map(ipRange => ipRange.ip);

  let insideConfiguredRanges = false;

  insideConfiguredRanges = ipRangesParsed.some(ipRange => new IPRangeMatcher(ipRange).matches(ip));

  if (!insideConfiguredRanges) {
    notifyProblem();
    const sendForAnalysis = await DefaultPreference.get('sendForAnalysis');
    if (sendForAnalysis) {
      // send IP, latestIp, telecomIdentifier and ipRanges for analysis
    }
  }

  userSettings.latestIp = ip;

  await userSettingsRepo.updateUserSettingItems(db, [userSettings]);

  var tracerouteHops = '';
  try {
    var fillHops = function (output) {
      tracerouteHops += output;
    };
    await traceroute('1.1.1.1', fillHops);
  } catch (ex) {
    console.error(ex);
    tracerouteHops += ex.message;
  }

  var cellInfo = await getCellInfo();

  console.log('Saving log with cellInfo ' + cellInfo);
  await logRepo.saveLogItems(db, [
    {
      insideIpRange: insideConfiguredRanges,
      ipAddress: ip,
      ipRange: JSON.stringify(ipRangesParsed),
      createdDate: new Date().toISOString(),
      errorMessage: errorMessage,
      cellularGeneration: cellularGeneration,
      carrier: carrier,
      tracerouteHops: tracerouteHops,
      cellInfo: cellInfo,
    },
  ]);
  return insideConfiguredRanges;
};

async function getCellInfo() {
  var cellInfo = '';
  try {
    if (Platform.OS === 'android') {
      try {
        var hasBackgroundPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
        );
        var hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (!hasBackgroundPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Location Permission',
              message:
                'In order to get cellular info, ' +
                'the app needs permission to access the device location',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            hasBackgroundPermission = true;
          }
        } else if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'In order to get cellular info, ' +
                'the app needs permission to access the device location',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            hasPermission = true;
          }
        }
      } catch (err) {
        console.warn(err);
      }

      if (hasBackgroundPermission || hasPermission) {
        await Telephony.getCellInfo(cellInfos => {
          cellInfos.map(info => {
            console.log('Cell identity:' + JSON.stringify(info.cellIdentity));
            cellInfo += JSON.stringify(info.cellIdentity) + '\n';
          });
        });

        cellInfo +=
          'GPS Coordinates:' +
          JSON.stringify(
            await GetLocation.getCurrentPosition({
              timeout: 10000,
            })
          );
      }
    }
  } catch (ex) {
    console.error('Cell info problem: ' + ex);
  }
  return cellInfo;
}
