import { StyleSheet, View } from 'react-native';
import React from 'react';
import { Button, Text, useTheme } from 'react-native-paper';
import { AsnDb } from '../lib/db/mobile-operator.repo';

const styles = StyleSheet.create({
  deleteContainer: {
    gap: 16,
  },
  button: {},
});

export type SelectAsnWarningProps = {
  pressedSelect: (payload: { asn: AsnDb; userSettingId: number }) => Promise<void>;
  pressedCancel: () => void;
  asn: AsnDb;
  userSettingId: number;
};
export const SelectAsnWarning = ({
  pressedSelect,
  pressedCancel,
  asn,
  userSettingId,
}: SelectAsnWarningProps) => {
  const theme = useTheme();

  return (
    <View style={styles.deleteContainer}>
      <Text variant="bodyLarge">
        Are you sure you want to select mobile operator with name
        <Text style={{ fontWeight: 'bold' }}> {asn?.operatorName}</Text>?
      </Text>
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
          mode="contained-tonal"
          style={styles.button}
          onPress={() => pressedCancel()}
        >
          Cancel
        </Button>
        <Button
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          mode="contained-tonal"
          style={styles.button}
          onPress={() => pressedSelect({ asn, userSettingId })}
        >
          Select
        </Button>
      </View>
    </View>
  );
};
