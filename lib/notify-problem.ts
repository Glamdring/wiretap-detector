// import { Notification, Notifications } from 'react-native-notifications';

export const notifyProblem = () => {
  const body =
    'IP changed outside the range of your telecom or cannot be obtained. This may indicate your phone is connected to a malicous cell tower';
  const title = 'Possible wiretapping detected';
  // TODO: fix doInBackground exception when using notifications
  // const notification: Notification = {
  //   payload: {
  //     body,
  //     title,
  //   },
  //   body,
  //   title,
  //   sound: '',
  //   badge: 0,
  //   type: '',
  //   thread: '',
  //   identifier: new Date().toISOString(),
  // };
  //
  // let localNotification = Notifications.postLocalNotification(notification);
  const localNotification = body;

  console.warn(localNotification);

  return localNotification;
};
