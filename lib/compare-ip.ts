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

export type IP = string;

export const compareIP = async (db?: SQLiteDatabase): Promise<boolean> => {
  const { type } = await fetch();
  if (type !== NetInfoStateType.cellular) {
    console.debug('network type', type);
    // returning "true" as wiretapping deteciton is not available for Wi-Fi
    return true;
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

  // check connection type for a 2nd time, as it may have changed while waiting for the IP
  const { currentConnectionType } = await fetch();
  if (currentConnectionType !== NetInfoStateType.cellular) {
    console.debug('network type', currentConnectionType);
    // returning "true" as wiretapping deteciton is not available for Wi-Fi
    return true;
  }
  
  userSettings.latestIp = ip;

  await userSettingsRepo.updateUserSettingItems(db, [userSettings]);

  await logRepo.saveLogItems(db, [
    {
      insideIpRange: insideConfiguredRanges,
      ipAddress: ip,
      ipRange: JSON.stringify(ipRangesParsed),
      createdDate: new Date().toISOString(),
      errorMessage: errorMessage,
    },
  ]);
  return insideConfiguredRanges;
};
