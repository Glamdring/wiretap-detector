import { enablePromise, SQLiteDatabase } from 'react-native-sqlite-storage';

const tableName = 'mobileOperator';

enablePromise(true);

export type AsnDb = {
  id?: number;
  asn: string;
  operatorName: string;
  countryCode: string;
};

const createMobileOperatorTable = async (db: SQLiteDatabase) => {
  // create table if not exists
  const query = `CREATE TABLE IF NOT EXISTS ${tableName}(
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        operatorName TEXT NOT NULL UNIQUE,
        asn TEXT NOT NULL UNIQUE,
        countryCode TEXT NOT NULL
    );`;

  await db.executeSql(query);
};

const getAsns = async (db: SQLiteDatabase): Promise<AsnDb[]> => {
  try {
    const asns: AsnDb[] = [];
    const results = await db.executeSql(
      `SELECT rowid as id, asn, operatorName, countryCode FROM ${tableName}`
    );
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        asns.push(result.rows.item(index));
      }
    });
    return asns;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get asns!');
  }
};

const saveAsnItems = async (db: SQLiteDatabase, asnItems: AsnDb[]) => {
  const insertQuery =
    `INSERT INTO ${tableName}(asn, operatorName, countryCode) values` +
    asnItems.map(i => `('${i.asn}', '${i.operatorName}', '${i.countryCode}')`).join(',');

  return db.executeSql(insertQuery);
};

const updateAsnItems = async (db: SQLiteDatabase, asnItems: AsnDb[]) => {
  const insertQuery =
    `REPLACE INTO ${tableName}(rowid, asn, operatorName, countryCode) values` +
    asnItems.map(i => `('${i.id}', '${i.asn}', '${i.operatorName}', '${i.countryCode}')`).join(',');

  return db.executeSql(insertQuery);
};

const deleteAsnItem = async (db: SQLiteDatabase, id: number) => {
  const deleteQuery = `DELETE from ${tableName} where rowid = ${id}`;
  await db.executeSql(deleteQuery);
};

const deleteMobileOperatorsTable = async (db: SQLiteDatabase) => {
  const query = `drop table if exists ${tableName}`;

  await db.executeSql(query);
};

const getSelectedAsn = async (db: SQLiteDatabase): Promise<AsnDb> => {
  const asns = [];
  const query = `SELECT mo.rowid as id, mo.asn, mo.operatorName, mo.countryCode FROM ${tableName} mo INNER JOIN userSetting us ON mo.rowid = us.operatorId LIMIT 1`;

  const results = await db.executeSql(query);

  results.forEach(result => {
    for (let index = 0; index < result.rows.length; index++) {
      asns.push(result.rows.item(index));
    }
  });

  return asns[0];
};

export const mobileOperatorsRepo = {
  createMobileOperatorTable,
  saveAsnItems,
  getAsns,
  updateAsnItems,
  deleteAsnItem,
  deleteMobileOperatorsTable,
  getSelectedAsn,
};
