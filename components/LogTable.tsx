import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Moment from 'moment';
import {
  Button,
  DataTable,
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { AsnDb } from '../lib/db/mobile-operator.repo';
import { Log, logRepo } from '../lib/db/log.repo';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { IpRangeComponent } from './IpRange';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 16,
  },
  infoContainer: {},
});

export type LogTableProps = {
  deps: {
    db: SQLiteDatabase;
  };
  clickedRefreshAndCompare: string;
};
export const LogTable = ({ deps, clickedRefreshAndCompare }: LogTableProps) => {
  const theme = useTheme();
  const modalStyle = { backgroundColor: 'white', padding: 20 };

  const [logId, setLogId] = useState<number>();
  const [ipRangeModal, setIpRangeModal] = useState(false);
  const [logs, setLogs] = useState<Log[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [page, setPage] = React.useState(0);
  const [numberOfItemsPerPage, onItemsPerPageChange] = React.useState(5);

  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, logs?.length);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage]);

  useEffect(() => {
    getLogs();
  }, [clickedRefreshAndCompare]);
  const getLogs = async () => {
    try {
      setLoading(true);
      const logs = await logRepo.getLogs(deps.db);
      setLogs(logs);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!logs) {
      getLogs();
    }
  }, []);

  const handleIpRangePress = async (logId: number) => {
    setLogId(logId);
    setIpRangeModal(true);
  };

  const refreshLog = async () => {
    await getLogs();
  };

  return (
    <View style={styles.container}>
      {loading ? <ProgressBar indeterminate={true}></ProgressBar> : ''}
      <DataTable>
        <DataTable.Header>
          <DataTable.Title style={{ flex: 4 }}>Time</DataTable.Title>
          <DataTable.Title style={{ flex: 5 }}>IP</DataTable.Title>
          <DataTable.Title style={{ flex: 1 }}>Type</DataTable.Title>
          <DataTable.Title style={{ flex: 2 }}>Status</DataTable.Title>
        </DataTable.Header>
        {logs
          ? logs.slice(from, to).map((l: Log) => {
              return (
                <DataTable.Row key={l.id}>
                  <DataTable.Cell style={{ flex: 4 }}>
                    {Moment(new Date(l.createdDate)).format('DD.MM HH:mm')}
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 5 }}>{l.ipAddress}&nbsp;</DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>{l.cellularGeneration}</DataTable.Cell>
                  <DataTable.Cell style={{ flex: 2 }}>
                    {!l.insideIpRange ? (
                      <IconButton
                        icon={'alert'}
                        size={25}
                        iconColor={theme.colors.error}
                        onPress={() => handleIpRangePress(l.id)}
                      ></IconButton>
                    ) : (
                      <IconButton
                        icon={'check'}
                        size={25}
                        iconColor={theme.colors.secondary}
                        onPress={() => handleIpRangePress(l.id)}
                      ></IconButton>
                    )}
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })
          : ''}
        <View style={{ flexDirection: 'row' }}>
          <IconButton mode="contained" onPressOut={() => refreshLog()} icon={'refresh'} size={20} />
          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(logs?.length / numberOfItemsPerPage)}
            onPageChange={page => setPage(page)}
            label={`${from + 1}-${to} of ${logs?.length}`}
            showFastPaginationControls
            numberOfItemsPerPage={numberOfItemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            selectPageDropdownLabel={'Rows per page'}
          />
        </View>
      </DataTable>

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
            logId={logId}
            deps={{ db: deps.db }}
            pressedCancel={() => setIpRangeModal(false)}
          ></IpRangeComponent>
        </Modal>
      </Portal>
    </View>
  );
};
