// sloppy traceroute clone
// inpired by https://blogs.oracle.com/ksplice/entry/learning_by_doing_writing_your
// and made possible by https://www.npmjs.org/package/raw-socket
import {spawn, exec, kill} from 'react-native-childprocess'

export const traceroute = async(dest, callback) => {
  await exec('/sbin/traceroute', [dest], {
      pwd: project.path,
      timeout: 10000,
      stdout: (output) => {
          callback(output);
      }
  });
}