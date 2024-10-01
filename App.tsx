import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MD3LightTheme, MD3Theme, PaperProvider, Snackbar, Text } from 'react-native-paper';
import { Info } from './components/Info';
import { getDBConnection, initDb } from './lib/db/db-service';
import { AsnDb, mobileOperatorsRepo } from './lib/db/mobile-operator.repo';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Platform, PermissionsAndroid, View, StyleSheet, ScrollView } from 'react-native';
import { OperatorsTable } from './components/OperatorsTable';
import { initAsns } from './lib/db/init-data';
import { userSettingsRepo } from './lib/db/user-setting.repo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogTable } from './components/LogTable';
import { ipRangesRepo } from './lib/db/ip-ranges.repo';
import { refreshRanges } from './lib/get-ranges';
import { initPermissions } from './lib/init-permissions';

const styles = StyleSheet.create({
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F0F4F9',
    flex: 1,
  },
  main: {
    gap: 16,
  },
});

export default function App() {
  const theme: MD3Theme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#1A73E8',
      secondary: '#03DAC6',
    },
  };

  const [db, setDb] = useState<SQLiteDatabase>(null);
  const [selectedAsn, setSelectedAsn] = useState<AsnDb>(null);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [isInsideIpRange, setIsInsideIpRange] = useState(false);
  const [clickedRefreshAndCompare, setClickedRefreshAndCompare] = useState<string>();

  const onDismissSnackBar = () => setVisibleSnackbar(false);

  const loadDataCallback = useCallback(async () => {
    try {
      const dbDep = await getDBConnection();
      // await deleteDb(dbDep);
      await initDb(dbDep);
      const asnsFromDb = await mobileOperatorsRepo.getAsns(dbDep);
      const userSettings = await userSettingsRepo.getUserSettings(dbDep);
      const ipRanges = await ipRangesRepo.getIpRange(dbDep);

      if (!asnsFromDb.length) {
        await mobileOperatorsRepo.saveAsnItems(dbDep, initAsns);
      }

      if (!ipRanges || ipRanges.length < 1) {
        await refreshRanges(dbDep);
      }

      setDb(dbDep);

      initPermissions();
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleRefreshAndCompare = (isInsideIpRange: boolean) => {
    setVisibleSnackbar(true);
    setIsInsideIpRange(isInsideIpRange);
    setClickedRefreshAndCompare(new Date().toISOString());
  };

  useEffect(() => {
    loadDataCallback();
  }, [loadDataCallback]);

  const changedAsn = (asn: AsnDb) => {
    setSelectedAsn(asn);
  };

  const initializedAsn = (asn: AsnDb) => {
    setSelectedAsn(asn);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <View style={styles.content}>
          <SafeAreaProvider>
            <SafeAreaView>
              <ScrollView>
                {db ? (
                  <View style={styles.main}>
                    <View>
                      <Text style={{ textAlign: 'center', paddingBottom: 8 }} variant="titleLarge">
                        Info
                      </Text>
                      <Info
                        clickedRefreshAndCompare={handleRefreshAndCompare}
                        selectedAsn={selectedAsn}
                        initializedAsn={initializedAsn}
                        deps={{ db }}
                      />
                    </View>
                    <View>
                      <Text style={{ textAlign: 'center', paddingBottom: 8 }} variant="titleLarge">
                        Log
                      </Text>
                      <LogTable
                        clickedRefreshAndCompare={clickedRefreshAndCompare}
                        deps={{ db }}
                      ></LogTable>
                    </View>
                    <View>
                      <Text style={{ textAlign: 'center', paddingBottom: 8 }} variant="titleLarge">
                        ASNs
                      </Text>
                      <OperatorsTable changedAsn={changedAsn} deps={{ db }}></OperatorsTable>
                    </View>
                  </View>
                ) : (
                  ''
                )}
              </ScrollView>
            </SafeAreaView>
            <StatusBar style="auto" />
            <Snackbar visible={visibleSnackbar} onDismiss={onDismissSnackBar}>
              <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
                Wiretapping {isInsideIpRange ? 'NOT' : 'IS'} detected
              </Text>
            </Snackbar>
          </SafeAreaProvider>
        </View>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
