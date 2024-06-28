import { enablePromise, SQLiteDatabase } from 'react-native-sqlite-storage';

const tableName = 'ipRange';

enablePromise(true);

export type IpRange = {
  id?: number;
  ip: string;
};

const createIpRangesTable = async (db: SQLiteDatabase) => {
  // create table if not exists
  const query = `CREATE TABLE IF NOT EXISTS ${tableName}(
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL UNIQUE
    );`;

  await db.executeSql(query);
};

const getIpRange = async (db: SQLiteDatabase): Promise<IpRange[]> => {
  try {
    const ipRange: IpRange[] = [];
    const results = await db.executeSql(`SELECT rowid as id, ip FROM ${tableName}`);
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        ipRange.push(result.rows.item(index));
      }
    });
    return ipRange;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get ip range!');
  }
};

const saveIpRangeItems = async (db: SQLiteDatabase, ipRangeItems: IpRange[]) => {
  await deleteAllIpRangeItems(db);

  const insertQuery =
    `INSERT INTO ${tableName}(ip) values` + ipRangeItems.map(i => `('${i.ip}')`).join(',');

  return db.executeSql(insertQuery);
};

const deleteAllIpRangeItems = async (db: SQLiteDatabase) => {
  const deleteQuery = `DELETE from ${tableName}`;
  await db.executeSql(deleteQuery);
};

const deleteIpRangeTable = async (db: SQLiteDatabase) => {
  const query = `drop table if exists ${tableName}`;

  await db.executeSql(query);
};

export const ipRangesRepo = {
  createIpRangesTable,
  saveIpRangeItems,
  getIpRange,
  deleteAllIpRangeItems,
  deleteIpRangeTable,
};
