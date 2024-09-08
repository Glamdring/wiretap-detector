import { spawn } from 'react-native-child-process-exec';

export const traceroute = async (dest, synchronous, callback) => {
  try {
    console.log('Traceroute to ' + dest);
    // getting just 2 hops, which is enough to identify anomalies
    for (var i = 1; i <= 2; i++) {
      var result = await spawn(
        'ping',
        ['-c', '1', '-t', '' + i, '-s', '56', '-i', '1', '-n', '-w', '10', dest],
        {
          pwd: '/',
          timeout: 10,
          stdout: callback,
          stderr: callback,
          synchrounous: synchronous,
        }
      );
      callback(result);
    }
  } catch (ex) {
    console.error(ex);
    callback('Traceroute error: ' + ex.message);
  }
};
