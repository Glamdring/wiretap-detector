type IpifyResponse = {
  ip: string;
};
export type IP = string;

export const getIp = async (): Promise<IP> => {
  const response: Response = await fetch('https://api.ipify.org/?format=json');
  const ipifyResponse: IpifyResponse = await response.json();

  return ipifyResponse.ip;
};
