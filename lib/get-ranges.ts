import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDBConnection } from './db/db-service';
import { mobileOperatorsRepo } from './db/mobile-operator.repo';
import { ipRangesRepo } from './db/ip-ranges.repo';

type IpifyGuideResponse = {
  asn: number;
  name: string;
  organization: string;
  country: string;
  rir: string;
  routes: {
    v4: string[];
    v6: string[];
  };
};

export type Range = string[];

export const refreshRanges = async (db?: SQLiteDatabase, asn?: string) => {
  if (!db) {
    db = await getDBConnection();
  }

  const telecomASN = asn ? { asn } : await mobileOperatorsRepo.getSelectedAsn(db);
  try {
    const response = await fetch('https://ip.guide/' + telecomASN.asn);
    const ipRanges = ((await response.json()) as IpifyGuideResponse).routes.v4;
    await ipRangesRepo.saveIpRangeItems(
      db,
      ipRanges.map(ip => ({ ip }))
    );
  } catch (ex) {
    console.error(ex);
  }
};
