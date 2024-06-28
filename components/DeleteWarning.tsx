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

export type DeleteWarningProps = {
  pressedDelete: (payload: { id: number }) => Promise<void>;
  pressedCancel: () => void;
  asn: AsnDb;
};
export const DeleteWarning = ({ pressedDelete, pressedCancel, asn }: DeleteWarningProps) => {
  const theme = useTheme();
  return (
    <View style={styles.deleteContainer}>
      <Text variant="bodyLarge">
        Are you sure you want to delete mobile operator with name {asn?.operatorName}?
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
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          mode="contained-tonal"
          style={styles.button}
          onPress={() => pressedCancel()}
        >
          Cancel
        </Button>
        <Button
          mode="contained-tonal"
          style={styles.button}
          onPress={() => pressedDelete({ id: asn.id })}
        >
          Delete
        </Button>
      </View>
    </View>
  );
};
