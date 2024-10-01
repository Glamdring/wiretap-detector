import { AsnDb } from './mobile-operator.repo';
import { UserSetting } from './user-setting.repo';

export const initAsns: AsnDb[] = [
  { operatorName: 'A1', asn: 'AS12716', countryCode: 'BG' },
  { operatorName: 'Vivacom', asn: 'AS8866', countryCode: 'BG' },
  { operatorName: 'Yettel', asn: 'AS29244', countryCode: 'BG' },
];
export const initUserSettings = (asnId: number): UserSetting[] => {
  return [{ operatorId: asnId }];
};
