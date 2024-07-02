import { StyleSheet, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, ProgressBar, Text, useTheme } from 'react-native-paper';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { ipRangesRepo } from '../lib/db/ip-ranges.repo';
import { ScrollView } from 'react-native-gesture-handler';
import { logRepo } from '../lib/db/log.repo';

const styles = StyleSheet.create({
  container: {},
});

export type IpRangeProps = {
  pressedCancel: () => void;
  logId?: number;
  deps: {
    db: SQLiteDatabase;
  };
};
export const IpRangeComponent = ({ logId, pressedCancel, deps }: IpRangeProps) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>();
  const [ipRange, setIpRange] = useState<string[]>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [carrier, setCarrier] = useState<string>();

  const loadDataCallback = useCallback(async () => {
    setLoading(true);

    if (logId) {
      const log = await logRepo.getLogById(deps.db, logId);
      
      const ipRange = logId
        ? JSON.parse(log.ipRange)
        : (await ipRangesRepo.getIpRange(deps.db)).map(range => range.ip);

      const msg = log.errorMessage;
        
      const carrier = log.carrier;
      
      setIpRange(ipRange);
      setErrorMessage(msg);
      setCarrier(carrier);
    } else {
      setIpRange(await ipRangesRepo.getIpRange(deps.db).map(range => range.ip));
      setErrorMessage('');
      setCarrier('');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDataCallback();
  }, [loadDataCallback]);

  return (
    <View>
      {loading ? <ProgressBar indeterminate={true}></ProgressBar> : ''}
      {(errorMessage && errorMessage != '') ? (<Text variant="bodyLarge">Error: {errorMessage}</Text>) : ''}
      <Text variant="bodyLarge">Detected operator: {carrier}</Text>
      <ScrollView style={{ height: 300, overflow: 'hidden' }}>
        {ipRange
          ? ipRange.map((ip, idx) => (
              <Text variant="labelLarge" key={idx}>
                {ip}
              </Text>
            ))
          : !loading && <Text variant="labelLarge">No ip range obtained from db</Text>}
      </ScrollView>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          mode="contained-tonal"
          onPress={() => pressedCancel()}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
};
