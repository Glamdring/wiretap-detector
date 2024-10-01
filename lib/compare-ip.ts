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
import { initPermissions } from './init-permissions';
import { AsnDb, mobileOperatorsRepo } from './db/mobile-operator.repo';
import { initUserSettings } from './db/init-data';

export type IP = string;
let ipRegex = /[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}/;

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

  const userSettings = await userSettingsRepo.getUserSettings(db);

  if (!ip || ip == '') {
    ip = 'Unavailable';
    notifyProblem();
  }

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

  var tracerouteHops = [];
  try {
    var fillHops = function (output) {
      console.log('Traceroute hop: ' + output);
      var lines = output.split(/\r?\n|\r|\n/g);
      for (const line of lines) {
        if (line.includes('From')) {
          let ip = line.match(ipRegex)[0];
          tracerouteHops.push(ip);
        }
      }
    };
    await traceroute('8.8.8.8', Platform.OS === 'android', fillHops);
  } catch (ex) {
    console.error(ex);
    tracerouteHops.push(ex.message.replace("'", '"'));
  }

  var cellInfo = await getCellInfo();

  var lat = '0';
  var lon = '0';
  var cellId = '0';

  try {
    console.log('Extracting cell info for ' + cellInfo.length + ' cells');
    for (const info of cellInfo) {
      console.log('Extracting data from cell: ' + JSON.stringify(info));
      if (info.servingCellFlag == true) {
        cellId = info.cid;
      } else if (info.latitude) {
        lat = info.latitude;
        lon = info.longitude;
      }
    }
  } catch (error) {
    console.log('Failed to extract coordinates and cell ID ' + error);
  }

  var cellInfoString = JSON.stringify(cellInfo);
  console.log('Saving log with cellInfo ' + cellInfoString);

  var unexpectedCellIdChange = false;
  var unknownTracerouteHop = false;
  try {
    var latestLogs = await logRepo.getLatestLogs(db);

    for (const log of latestLogs) {
      // check for changing cellIds within the same small area (sometimes CIDs change by 1, which appears to be normal behavior)
      if (log.lat - lat < 0.0001 && log.lon - lon < 0.0001 && log.cellId - cellId > 1) {
        unexpectedCellIdChange = true;
      }
      if (tracerouteHops.length > 0) {
        if (!JSON.parse(log.tracerouteHops).includes(tracerouteHops[0])) {
          unknownTracerouteHop = true;
        }
      }
    }
  } catch (error) {
    console.log('Failed to check for cellId change and unknown traceroute hops due to ' + error);
  }

  // ignore everything if wifi was turned on in the meantime
  const secondState = await fetch();
  if (secondState.type !== NetInfoStateType.cellular) {
    console.debug('network type', secondState.type);
    // returning "true" as wiretapping deteciton is not available for Wi-Fi
    return true;
  }

  await logRepo.saveLogItems(db, [
    {
      insideIpRange: insideConfiguredRanges,
      ipAddress: ip,
      ipRange: JSON.stringify(ipRangesParsed),
      createdDate: new Date().toISOString(),
      errorMessage: errorMessage,
      cellularGeneration: cellularGeneration,
      carrier: carrier,
      tracerouteHops: JSON.stringify(tracerouteHops),
      cellInfo: cellInfoString,
      cellId: cellId,
      lat: lat,
      lon: lon,
      unexpectedCellIdChange: unexpectedCellIdChange,
      unknownTracerouteHop: unknownTracerouteHop,
    },
  ]);
  return insideConfiguredRanges;
};

async function getCellInfo() {
  const cellInfo = [];

  try {
    if (Platform.OS === 'android') {
      await initPermissions();

      var hasBackgroundPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );
      var hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (hasBackgroundPermission || hasPermission) {
        await Telephony.getCellInfo(cellInfos => {
          cellInfos.map(info => {
            console.log('Cell identity:' + JSON.stringify(info.cellIdentity));
            cellInfo.push(info.cellIdentity);
          });
        });

        cellInfo.push(await GetLocation.getCurrentPosition({ timeout: 10000 }));
      }
    }
  } catch (ex) {
    console.error('Cell info problem: ' + ex);
  }
  return cellInfo;
}
