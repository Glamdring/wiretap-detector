import { enablePromise, SQLiteDatabase } from 'react-native-sqlite-storage';

const tableName = 'log';

enablePromise(true);

export type Log = {
  id?: number;
  createdDate: string;
  insideIpRange: boolean;
  ipRange: string;
  ipAddress: string;
  errorMessage: string;
  cellularGeneration: string;
  carrier: string;
  tracerouteHops: string;
  cellInfo: string;
};

const createLogsTable = async (db: SQLiteDatabase) => {
  // create table if not exists
  const query = `CREATE TABLE IF NOT EXISTS ${tableName}(
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        createdDate DATETIME NOT NULL,
        insideIpRange BOOLEAN NOT NULL,
        ipRange TEXT NOT NULL,
        ipAddress TEXT NOT NULL,
        errorMessage TEXT NOT NULL,
        cellularGeneration TEXT NOT NULL,
        carrier TEXT NOT NULL,
        tracerouteHops TEXT NOT NULL,
        cellInfo TEXT NOT NULL
    );`;

  await db.executeSql(query);
};

const getLogById = async (db: SQLiteDatabase, logId: number): Promise<Log> => {
  try {
    const logs: Log[] = [];
    const results = await db.executeSql(
      `SELECT rowid as id, createdDate, insideIpRange, ipRange, ipAddress, errorMessage, cellularGeneration, carrier, tracerouteHops, cellInfo FROM ${tableName} WHERE id = ${logId} ORDER BY createdDate DESC`
    );
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        const log: Log = {
          ...result.rows.item(index),
          insideIpRange: JSON.parse(result.rows.item(index).insideIpRange),
        };

        logs.push(log);
      }
    });

    if (logs.length < 1) {
      console.error('Could not find log with id ', logId);
    }

    return logs[0];
  } catch (error) {
    console.error(error);
    throw Error('Failed to get ip range!');
  }
};

const getLogs = async (db: SQLiteDatabase): Promise<Log[]> => {
  try {
    const logs: Log[] = [];
    const results = await db.executeSql(
      `SELECT rowid as id, createdDate, insideIpRange, ipRange, ipAddress, errorMessage, cellularGeneration, carrier, tracerouteHops, cellInfo FROM ${tableName} ORDER BY createdDate DESC`
    );
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        const log: Log = {
          ...result.rows.item(index),
          insideIpRange: JSON.parse(result.rows.item(index).insideIpRange),
        };

        logs.push(log);
      }
    });
    return logs;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get ip range!');
  }
};

const getLatestLogs = async (db: SQLiteDatabase): Promise<Log[]> => {
  try {
    const logs: Log[] = [];
    const results = await db.executeSql(
      `SELECT rowid as id, createdDate, insideIpRange, ipRange, ipAddress, errorMessage, cellularGeneration, carrier, tracerouteHops, cellInfo FROM ${tableName} ORDER BY createdDate DESC LIMIT 2`
    );
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        const log: Log = {
          ...result.rows.item(index),
          insideIpRange: JSON.parse(result.rows.item(index).insideIpRange),
        };

        logs.push(log);
      }
    });
    return logs;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get ip range!');
  }
};

const saveLogItems = async (db: SQLiteDatabase, logs: Log[]) => {
  const insertQuery =
    `INSERT INTO ${tableName}(createdDate, insideIpRange, ipRange, ipAddress, errorMessage, cellularGeneration, carrier, tracerouteHops, cellInfo) values` +
    logs
      .map(
        i =>
          `('${i.createdDate}', '${i.insideIpRange}', '${i.ipRange}', '${i.ipAddress}', '${i.errorMessage}', '${i.cellularGeneration}', '${i.carrier}', '${i.tracerouteHops}', '${i.cellInfo}')`
      )
      .join(',');

  console.log('Inserting new record: ' + insertQuery);

  return db.executeSql(insertQuery);
};

const deleteLogTable = async (db: SQLiteDatabase) => {
  const query = `drop table if exists ${tableName}`;

  await db.executeSql(query);
};

export const logRepo = {
  createLogsTable,
  saveLogItems,
  getLogs,
  getLogById,
  deleteLogTable,
  getLatestLogs,
};
