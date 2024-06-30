type IpifyResponse = {
  ip: string;
};
export type IP = string;

export const getIp = async (): Promise<IP> => {
  const fetch = require('fetch-retry')(global.fetch);
  const response: Response = await fetch('https://api.ipify.org/?format=json', {
    retries: 3,
    retryDelay: function(attempt, error, response) {
      return Math.pow(2, attempt) * 3000; // 3000, 6000, 12000
    }
  });
  const ipifyResponse: IpifyResponse = await response.json();

  return ipifyResponse.ip;
};
