import { registerRootComponent } from 'expo';
import BackgroundFetch from 'react-native-background-fetch';

import App from './App';
import { compareIP } from './lib/compare-ip';
import { refreshRanges } from './lib/get-ranges';
//
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);


const COMPARE_IP_TASK = 'com.wiretapdetector.compareIP';
const REFRESH_RANGES_TASK = 'com.wiretapdetector.refreshRanges';

export const onEvent = async (taskId) => {
  console.info('task id', taskId);
  switch (taskId) {
    case COMPARE_IP_TASK:
      await compareIP();
      break;
    case REFRESH_RANGES_TASK:
      await refreshRanges();
      break;
  }
  BackgroundFetch.finish(taskId);
};

export const onTimeout = async (taskId) => {
  console.warn(`Background fetch timeout: ${taskId}`);
  BackgroundFetch.finish(taskId);
};


const setupBackgroundJobs = async () => {
  await BackgroundFetch.scheduleTask({
    taskId: COMPARE_IP_TASK,
    periodic: true,
    delay: 1 * 15 * 60 * 1000, // 15 minutes
    forceAlarmManager: true,
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_CELLULAR,
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
  });

  await BackgroundFetch.scheduleTask({
    taskId: REFRESH_RANGES_TASK,
    periodic: true,
    delay: 24 * 60 * 60 * 1000, // 24 hours
    forceAlarmManager: true,
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
  });
};

setupBackgroundJobs();
BackgroundFetch.configure(
  {
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
    forceAlarmManager: true,
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_CELLULAR,
  },
  onEvent,
  onTimeout
);
BackgroundFetch.start();

BackgroundFetch.registerHeadlessTask(async event => {
  const { taskId, timeout } = event;
  console.debug('hsTask event: ', JSON.stringify(event));
  if (timeout) {
    onTimeout(taskId);
  }
  onEvent(taskId);
});

