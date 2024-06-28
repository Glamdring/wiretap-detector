import { SQLiteDatabase, enablePromise, openDatabase } from 'react-native-sqlite-storage';
import { mobileOperatorsRepo } from './mobile-operator.repo';
import { userSettingsRepo } from './user-setting.repo';
import { ipRangesRepo } from './ip-ranges.repo';
import { logRepo } from './log.repo';

enablePromise(true);

export const getDBConnection = async () => {
  return openDatabase({ name: 'asn-data.db', location: 'default' });
};

export const initDb = async (db: SQLiteDatabase) => {
  await mobileOperatorsRepo.createMobileOperatorTable(db);
  await userSettingsRepo.createUserSettingsTable(db);
  await ipRangesRepo.createIpRangesTable(db);
  await logRepo.createLogsTable(db);
};

export const deleteDb = async (db: SQLiteDatabase) => {
  await mobileOperatorsRepo.deleteMobileOperatorsTable(db);
  await userSettingsRepo.deleteUserSettingsTable(db);
  await logRepo.deleteLogTable(db);
  await ipRangesRepo.deleteIpRangeTable(db);
};
