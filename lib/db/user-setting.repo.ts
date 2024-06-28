import { enablePromise, SQLiteDatabase } from 'react-native-sqlite-storage';

const tableName = 'userSetting';

enablePromise(true);

export type UserSetting = {
  id?: number;
  operatorId: number;
  latestIp?: string;
};

const createUserSettingsTable = async (db: SQLiteDatabase) => {
  // create table if not exists
  const query = `CREATE TABLE IF NOT EXISTS ${tableName}(
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        operatorId INTEGER NOT NULL,
        latestIp TEXT
    );`;

  await db.executeSql(query);
};

const getUserSettings = async (db: SQLiteDatabase): Promise<UserSetting> => {
  try {
    const userSettings: UserSetting[] = [];
    const results = await db.executeSql(
      `SELECT rowid as id, operatorId, latestIp FROM ${tableName}`
    );
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        userSettings.push(result.rows.item(index));
      }
    });
    if (!userSettings || userSettings.length < 1) {
      return null;
    }
    return userSettings[0];
  } catch (error) {
    console.error(error);
    throw Error('Failed to get user settings!');
  }
};

const saveUserSettingItems = async (db: SQLiteDatabase, userSettingItems: UserSetting[]) => {
  const insertQuery =
    `INSERT INTO ${tableName}(operatorId, latestIp) values` +
    userSettingItems.map(i => `('${i.operatorId}', '${i.latestIp}')`).join(',');

  return db.executeSql(insertQuery);
};

const updateUserSettingItems = async (db: SQLiteDatabase, userSettingItems: UserSetting[]) => {
  const insertQuery =
    `REPLACE INTO ${tableName}(rowid, operatorId, latestIp) values` +
    userSettingItems.map(i => `(${i.id}, '${i.operatorId}', '${i.latestIp}')`).join(',');

  return db.executeSql(insertQuery);
};

const deleteUserSettingsItem = async (db: SQLiteDatabase, id: number) => {
  const deleteQuery = `DELETE from ${tableName} where rowid = ${id}`;
  await db.executeSql(deleteQuery);
};

const deleteUserSettingsTable = async (db: SQLiteDatabase) => {
  const query = `drop table if exists ${tableName}`;

  await db.executeSql(query);
};

export const userSettingsRepo = {
  createUserSettingsTable,
  getUserSettings,
  saveUserSettingItems,
  updateUserSettingItems,
  deleteUserSettingsItem,
  deleteUserSettingsTable,
};
