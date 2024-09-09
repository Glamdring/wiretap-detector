import React, { useEffect, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInputChangeEventData, View } from 'react-native';
import { Button, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { AsnDb, mobileOperatorsRepo } from '../lib/db/mobile-operator.repo';

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  button: {},
  form: {
    display: 'flex',
    gap: 16,
    width: '100%',
  },
  buttonContainer: {
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
});

type FormErrors = { [key: string]: string };

export type AddMobileOperatorProps = {
  editAsn?: AsnDb;
  onClickSave: (asn: AsnDb) => void;
  pressedCancel: () => void;
  deps: {
    db: SQLiteDatabase;
  };
};

export const AddMobileOperator = ({
  editAsn,
  deps,
  onClickSave,
  pressedCancel,
}: AddMobileOperatorProps) => {
  const theme = useTheme();

  const [name, setName] = useState<string>();
  const [asn, setAsn] = useState<string>();
  const [countryCode, setCountryCode] = useState<string>();
  const [errors, setErrors] = useState<FormErrors>({});
  useEffect(() => {
    if (!editAsn) {
      return;
    }

    setName(editAsn.operatorName);
    setAsn(editAsn.asn);
    setCountryCode(editAsn.countryCode);
  }, [editAsn]);

  const handleChange = (
    field: 'asn' | 'name' | 'countryCode',
    e: NativeSyntheticEvent<TextInputChangeEventData>
  ) => {
    switch (field) {
      case 'asn':
        return setAsn(e.nativeEvent.text);
      case 'name':
        return setName(e.nativeEvent.text);
      case 'countryCode':
        return setCountryCode(e.nativeEvent.text);
    }
  };

  const handleSubmit = async () => {
    validateForm();
    if (Object.keys(errors).find(key => errors[key] !== undefined)) {
      return;
    }

    if (editAsn) {
      await mobileOperatorsRepo.updateAsnItems(deps.db, [
        { id: editAsn.id, asn, operatorName: name, countryCode: countryCode },
      ]);
    } else {
      await mobileOperatorsRepo.saveAsnItems(deps.db, [
        { asn, operatorName: name, countryCode: countryCode },
      ]);
    }
    const asns = await mobileOperatorsRepo.getAsns(deps.db);
    const savedAsn = asns.find(a => a.asn === editAsn?.asn || asn);
    onClickSave(savedAsn);
  };

  const hasError = (field: 'asn' | 'name' | 'countryCode') => {
    switch (field) {
      case 'asn':
        return !!errors?.asn;
      case 'name':
        return !!errors?.name;
      case 'countryCode':
        return !!errors?.countryCode;
    }
  };

  const validateForm = () => {
    setErrors({
      ...errors,
      asn: !asn ? 'ASN is required!' : undefined,
      name: !name ? 'Operator name is required!' : undefined,
      countryCode: !countryCode ? 'Country code is required!' : undefined,
    });

    return errors;
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View>
          <TextInput
            onChange={e => handleChange('name', e)}
            label={'Operator name'}
            error={hasError('name')}
            value={name}
          />
          {errors.name ? (
            <Text style={{ color: theme.colors.error }}>Operator name is required</Text>
          ) : (
            ''
          )}
        </View>
        <View>
          <TextInput
            value={asn}
            onChange={e => handleChange('asn', e)}
            label={'ASN'}
            error={hasError('asn')}
          />
          {errors.asn ? <Text style={{ color: theme.colors.error }}>ASN is required</Text> : ''}
        </View>
        <View>
          <TextInput
            value={countryCode}
            onChange={e => handleChange('countryCode', e)}
            label={'Country code'}
            error={hasError('countryCode')}
          />
          {errors.countryCode ? (
            <Text style={{ color: theme.colors.error }}>Country code is required</Text>
          ) : (
            ''
          )}
        </View>
        <View style={styles.buttonContainer}>
          <Button
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            mode="contained-tonal"
            style={styles.button}
            onPress={() => pressedCancel()}
          >
            Cancel
          </Button>
          <Button mode="contained-tonal" style={styles.button} onPress={() => handleSubmit()}>
            <Text>{editAsn ? 'Edit' : 'Add'}</Text>
          </Button>
        </View>
      </View>
    </View>
  );
};
