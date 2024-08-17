// sloppy traceroute clone
// inpired by https://blogs.oracle.com/ksplice/entry/learning_by_doing_writing_your
// and made possible by https://www.npmjs.org/package/raw-socket
import { spawn } from 'react-native-child-process-exec';

export const traceroute = async (dest, callback) => {
  try {
    console.log('Traceroute to ' + dest);
    await spawn('/system/bin/traceroute', ['-m', '3', '-n', dest], {
      pwd: '/',
      stdout: callback,
      stderr: callback,
    });
  } catch (ex) {
    console.error(ex);
    callback('Traceroute error: ' + ex.message);
  }
};
