import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Button,
  DataTable,
  Icon,
  IconButton,
  Modal,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { AsnDb, mobileOperatorsRepo } from '../lib/db/mobile-operator.repo';
import { AddMobileOperator } from './AddNewMobileOperator';
import { DeleteWarning } from './DeleteWarning';
import { UserSetting, userSettingsRepo } from '../lib/db/user-setting.repo';
import { SelectAsnWarning } from './SelectAsnWarning';
import { refreshRanges } from '../lib/get-ranges';

export type OperatorsTableProps = {
  deps: {
    db: SQLiteDatabase;
  };
  changedAsn: (asn: AsnDb) => void;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 16,
  },
  button: {},
});

export const OperatorsTable = ({ deps, changedAsn }: OperatorsTableProps) => {
  const theme = useTheme();

  const [asnList, setAsnList] = useState<AsnDb[]>();
  const [asn, setAsn] = useState<AsnDb>();
  const [userSetting, setUserSetting] = useState<UserSetting>();
  const [editMobileOperator, setEditMobileOperator] = useState(false);
  const [deleteMobileOperator, setDeleteMobileOperator] = useState(false);
  const [selectAsnModal, setSelectAsnModal] = useState(false);
  const [selectAsnModalProps, setSelectAsnModalProps] = useState<{
    asn: AsnDb;
    userSettingId: number;
  }>();
  const containerStyle = { backgroundColor: 'white', padding: 20 };

  const hideEditMobileOperatorModal = () => {
    setEditMobileOperator(false);
    setAsn(null);
  };
  const hideDeleteMobileOperatorModal = () => {
    setDeleteMobileOperator(false);
    setAsn(null);
  };
  const hideSelectAsnModal = () => {
    setSelectAsnModal(false);
  };

  const getUserSettings = async () => {
    const userSettingsFromDb = await userSettingsRepo.getUserSettings(deps.db);
    const userSettings = userSettingsFromDb;
    setUserSetting(userSettings);
    return userSettings;
  };
  const getAsns = async () => {
    const asnsFromDb = await mobileOperatorsRepo.getAsns(deps.db);
    if (!asnsFromDb) {
      return [];
    }

    const asnList = asnsFromDb;
    setAsnList(asnList);
  };

  useEffect(() => {
    if (!asnList || asnList?.length < 1) {
      getAsns();
    }

    if (!userSetting) {
      getUserSettings();
    }
  }, []);

  const handleDelete = async (payload: { id: number }) => {
    const { id } = payload;
    await mobileOperatorsRepo.deleteAsnItem(deps.db, id);
    await getAsns();
    setDeleteMobileOperator(false);
  };

  const selectAsn = async (payload: { asn: AsnDb; userSettingId: number }) => {
    const { asn, userSettingId } = payload;
    let userSettingIdFromDb: number;
    if (!userSettingId) {
      ({ id: userSettingIdFromDb } = await getUserSettings());
    }
    await userSettingsRepo.updateUserSettingItems(deps.db, [
      {
        operatorId: asn.id,
        id: userSettingId || userSettingIdFromDb,
        latestIp: userSetting.latestIp,
      },
    ]);
    await getUserSettings();
    changedAsn(asn);
    await refreshRanges(deps.db, asn.asn);
    hideSelectAsnModal();
  };

  const handleMobileOperatorSave = async (asn: AsnDb) => {
    await getAsns();
    setEditMobileOperator(false);
  };

  const handleRowPress = async (payload: { asn: AsnDb; userSettingId: number }) => {
    const { asn, userSettingId } = payload;
    setSelectAsnModal(true);
    setSelectAsnModalProps(payload);
  };

  return (
    <View style={styles.container}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Name</DataTable.Title>
          <DataTable.Title>ASN</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>
        {asnList
          ? asnList.map((asn: AsnDb) => {
              return (
                <DataTable.Row
                  onPress={() =>
                    asn.id !== userSetting?.operatorId
                      ? handleRowPress({ asn, userSettingId: userSetting.id })
                      : null
                  }
                  key={asn.id}
                >
                  <DataTable.Cell>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text>{asn.operatorName}</Text>
                      {asn.id === userSetting?.operatorId ? (
                        <Icon size={20} source={'check'}></Icon>
                      ) : (
                        ''
                      )}
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell>{asn.asn}</DataTable.Cell>
                  <DataTable.Cell>
                    <IconButton
                      icon={'pencil'}
                      size={25}
                      iconColor={theme.colors.primary}
                      onPress={() => {
                        setEditMobileOperator(true);
                        setAsn(asn);
                      }}
                    ></IconButton>
                    <IconButton
                      disabled={asn.id === userSetting?.operatorId}
                      icon={'delete'}
                      size={25}
                      onPress={() => {
                        setDeleteMobileOperator(true);
                        setAsn(asn);
                      }}
                    ></IconButton>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })
          : ''}
      </DataTable>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingTop: 8,
          paddingRight: 8,
        }}
      >
        <Button
          mode="contained-tonal"
          onPress={() => {
            setEditMobileOperator(true);
            setAsn(null);
          }}
        >
          <View
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Icon source={'plus'} size={20} />
            <Text variant="labelLarge">Create new</Text>
          </View>
        </Button>
      </View>
      <Portal>
        <Modal
          dismissableBackButton={true}
          visible={selectAsnModal}
          onDismiss={hideSelectAsnModal}
          contentContainerStyle={containerStyle}
        >
          <Text variant="titleLarge" style={{ textAlign: 'center', paddingBottom: 8 }}>
            Select mobile operator
          </Text>
          <SelectAsnWarning
            pressedSelect={({ asn, userSettingId }) =>
              selectAsn({ asn, userSettingId: userSettingId })
            }
            userSettingId={selectAsnModalProps?.userSettingId}
            pressedCancel={hideSelectAsnModal}
            asn={selectAsnModalProps?.asn}
          />
        </Modal>
        <Modal
          dismissableBackButton={true}
          visible={deleteMobileOperator}
          onDismiss={hideDeleteMobileOperatorModal}
          contentContainerStyle={containerStyle}
        >
          <Text variant="titleLarge" style={{ textAlign: 'center', paddingBottom: 8 }}>
            Delete
          </Text>
          <DeleteWarning
            pressedDelete={handleDelete}
            pressedCancel={hideDeleteMobileOperatorModal}
            asn={asn}
          />
        </Modal>
        <Modal
          dismissableBackButton={true}
          visible={editMobileOperator}
          onDismiss={hideEditMobileOperatorModal}
          contentContainerStyle={containerStyle}
        >
          <Text variant="titleLarge" style={{ textAlign: 'center', paddingBottom: 8 }}>
            {asn ? 'Edit' : 'Add new'} mobile operator
          </Text>
          <AddMobileOperator
            pressedCancel={hideEditMobileOperatorModal}
            onClickSave={handleMobileOperatorSave}
            editAsn={asn}
            deps={deps}
          ></AddMobileOperator>
        </Modal>
      </Portal>
    </View>
  );
};
