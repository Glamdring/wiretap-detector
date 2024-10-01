import { Platform, PermissionsAndroid } from 'react-native';

export const initPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      var hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (!hasPermission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'In order to get cellular info, ' +
              'the app needs permission to access the device location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          hasPermission = true;
        }
      }

      var hasBackgroundPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );

      if (!hasBackgroundPermission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Location Permission',
            message:
              'In order to get cellular info, ' +
              'the app needs permission to access the device location in the background',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          hasBackgroundPermission = true;
        }
      }

      PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS')
        .then(response => {
          if (!response) {
            PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS', {
              title: 'Notification',
              message: 'App needs access to your notification ' + 'so you can get Updates',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            });
          }
        })
        .catch(err => {
          console.error('Notification Error', err);
        });
    } catch (err) {
      console.warn('Permission error:' + err);
    }
  }
};
