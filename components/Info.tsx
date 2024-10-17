import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, MD3Theme, Modal, Portal, ProgressBar, Text, useTheme } from 'react-native-paper';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getIp } from '../lib/get-ip';
import { AsnDb, mobileOperatorsRepo } from '../lib/db/mobile-operator.repo';
import { userSettingsRepo } from '../lib/db/user-setting.repo';
import { compareIP } from '../lib/compare-ip';
import { IpRangeComponent } from './IpRange';
import { NetInfoStateType, useNetInfo } from '@react-native-community/netinfo';
import { refreshRanges } from '../lib/get-ranges';
import { Log, logRepo } from '../lib/db/log.repo';
import { initUserSettings } from '../lib/db/init-data';

type InfoProps = {
  deps: {
    db: SQLiteDatabase;
  };
  selectedAsn: AsnDb;
  clickedRefreshAndCompare: (insideIpRange: boolean) => void;
  initializedAsn: (asn: AsnDb) => void;
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 16,
  },
  infoContainer: {},
});

const IpAddress = (props: {
  ip: string;
  loading: boolean;
  networkType: NetInfoStateType;
  theme: MD3Theme;
}) => {
  const { ip, loading, networkType, theme } = props;

  if (ip && networkType === 'cellular' && !loading) {
    return (
      <Text variant="bodyLarge" style={styles.infoContainer}>
        <Text>Your IP address: </Text>
        <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
          {ip}
        </Text>
      </Text>
    );
  }

  if (networkType !== 'cellular') {
    return (
      <Text variant="bodyLarge" style={styles.infoContainer}>
        <Text>Wiretapping detection not active on Wi-Fi</Text>
      </Text>
    );
  }

  if (!loading && networkType === 'cellular') {
    return <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>Could not get IP</Text>;
  }
};

export const Info = ({
  deps,
  selectedAsn,
  clickedRefreshAndCompare,
  initializedAsn,
}: InfoProps) => {
  const theme = useTheme();

  const [ip, setIp] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [asn, setAsn] = useState<AsnDb>();
  const [wiretappingDetected, setWiretappingDetected] = useState<boolean>(false);
  const [ipRangeModal, setIpRangeModal] = useState(false);
  const modalStyle = { backgroundColor: 'white', padding: 20 };
  const { type: networkType } = useNetInfo();

  const getLatestLogs = async () => {
    try {
      const logs = await logRepo.getLatestLogs(deps.db);
      logs.forEach(result => {
        if (
          (!result.insideIpRange ||
            !result.unexpectedCellIdChange ||
            !result.unknownTracerouteHop) &&
          result.ipAddress != 'Unavailable'
        ) {
          setWiretappingDetected(true);
        }
      });
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  const getSelectedAsn = async () => {
    const asnFromDb = await mobileOperatorsRepo.getSelectedAsn(deps.db);
    setAsn(asnFromDb);
  };

  const fetchIp = async () => {
    try {
      const ip = await getIp();
      let userSettings = await userSettingsRepo.getUserSettings(deps.db);
      if (!userSettings || !userSettings.operatorId) {
        console.log('Missing user settings; initializing');
        await initializeSettings(ip, deps.db);
        userSettings = await userSettingsRepo.getUserSettings(deps.db);
        initializedAsn(await mobileOperatorsRepo.getSelectedAsn(deps.db));
        await getSelectedAsn();
      }
      userSettings.latestIp = ip;
      await userSettingsRepo.updateUserSettingItems(deps.db, [userSettings]);
      setIp(ip);
      setLoading(true);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async (ip, dbDep) => {
    // initialize the ASN settings by obtaining the ASN details by the current IP
    const fetch = require('fetch-retry')(global.fetch);
    const response = await fetch('https://ip.guide/' + ip);
    const responseJSON = await response.json();
    console.log('IP details: ' + JSON.stringify(responseJSON));

    const autonomousSystem = responseJSON['network']['autonomous_system'];

    const asns = await mobileOperatorsRepo.getAsns(dbDep);

    if (!autonomousSystem) {
      console.log('Failed to obtain ASN');
      const settings = initUserSettings(asns[0].id);
      settings.latestIp = ip;
      await userSettingsRepo.saveUserSettingItems(dbDep, settings);
      return;
    }

    const asn = 'AS' + autonomousSystem['asn'];
    const organization = autonomousSystem['organization'];
    const countryCode = autonomousSystem['country'];

    const existingAsn = asns.find(e => e.asn == asn);
    if (existingAsn) {
      const settings = initUserSettings(existingAsn.id);
      settings.latestIp = ip;
      await userSettingsRepo.saveUserSettingItems(dbDep, settings);
    } else {
      // create new ASN
      const newAsn = await mobileOperatorsRepo.saveAsnItems(dbDep, [
        { asn: asn, operatorName: organization, countryCode: countryCode },
      ]);
      const settings = initUserSettings(newAsns.id);
      settings.latestIp = ip;
      await userSettingsRepo.saveUserSettingItems(dbDep, settings);
    }
  };

  const loadAsnCallback = useCallback(async () => {
    await getSelectedAsn();
  }, []);

  const loadWiretappingLabelCallaback = useCallback(async () => {
    await getLatestLogs();
  }, []);

  const loadIpCallback = useCallback(async () => {
    if (networkType === 'cellular') {
      await fetchIp();
    }
  }, [networkType]);

  useEffect(() => {
    loadAsnCallback();
  }, [loadAsnCallback]);
  useEffect(() => {
    loadWiretappingLabelCallaback();
  }, [loadWiretappingLabelCallaback]);
  useEffect(() => {
    loadIpCallback();
  }, [loadIpCallback]);

  const refreshAndCompare = async () => {
    await refreshRanges(deps.db);
    setLoading(true);
    const ip = await getIp();
    setIp(ip);

    const insideIpRange = await compareIP(deps.db);

    setLoading(false);

    clickedRefreshAndCompare(insideIpRange);
    return insideIpRange;
  };

  return (
    <View style={styles.container}>
      {loading ? <ProgressBar indeterminate={true}></ProgressBar> : ''}
      <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
        {wiretappingDetected ? 'Possible wiretapping detected!' : 'No wiretapping detected'}
      </Text>
      <IpAddress ip={ip} loading={loading} networkType={networkType} theme={theme} />
      {selectedAsn || asn ? (
        <Text variant="bodyLarge" theme={theme}>
          <Text>Selected mobile operator: </Text>
          <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
            {selectedAsn?.operatorName || asn.operatorName} ({selectedAsn?.asn || asn.asn})
          </Text>
        </Text>
      ) : (
        <Text variant="bodyMedium">Choose mobile operator from config</Text>
      )}
      {Platform.OS == 'ios' ? (
        <Text variant="bodyMedium">We recommend turning on Lockdown mode</Text>
      ) : (
        <Text variant="bodyMedium">We recommend disabling 2G in the SIM card settings</Text>
      )}
      <View
        style={{
          paddingTop: 16,
          flexDirection: 'column',
          alignItems: 'flex-end',
          flex: 1,
          width: '100%',
          gap: 8,
        }}
      >
        <Button mode="contained" onPress={() => refreshAndCompare()}>
          Check now
        </Button>
      </View>
      <Portal>
        <Modal
          dismissable={false}
          dismissableBackButton={true}
          visible={ipRangeModal}
          onDismiss={() => setIpRangeModal(false)}
          contentContainerStyle={modalStyle}
        >
          <Text variant="titleLarge" style={{ textAlign: 'center', paddingBottom: 8 }}>
            IP Range
          </Text>
          <IpRangeComponent
            deps={{ db: deps.db }}
            pressedCancel={() => setIpRangeModal(false)}
          ></IpRangeComponent>
        </Modal>
      </Portal>
    </View>
  );
};
