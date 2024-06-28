export type Address = {
  address: number[];
  equals: (other: Address) => boolean;
};

export class IPRangeMatcher {
  private readonly ipAddress: string;
  private readonly nMaskBits: number;
  private readonly requiredAddress: Address;

  constructor(ipAddress: string) {
    if (ipAddress.includes('/')) {
      const [address, mask] = ipAddress.split('/');
      this.ipAddress = address;
      this.nMaskBits = parseInt(mask);
    } else {
      this.ipAddress = ipAddress;
      this.nMaskBits = -1;
    }

    this.requiredAddress = this.parseAddress(this.ipAddress);
  }

  matches(address: string) {
    let remoteAddress: Address;
    try {
      remoteAddress = this.parseAddress(address);
    } catch (e) {
      return false;
    }
    if (this.requiredAddress.constructor !== remoteAddress.constructor) {
      return false;
    } else if (this.nMaskBits < 0) {
      return remoteAddress.equals(this.requiredAddress);
    } else {
      const remAddr = remoteAddress.address;
      const reqAddr = this.requiredAddress.address;
      const nMaskFullBytes = Math.floor(this.nMaskBits / 8);
      const finalByte = (0xff00 >> this.nMaskBits % 8) & 0xff;

      for (let i = 0; i < nMaskFullBytes; i++) {
        if (remAddr[i] !== reqAddr[i]) {
          return false;
        }
      }

      if (finalByte !== 0) {
        return (remAddr[nMaskFullBytes] & finalByte) === (reqAddr[nMaskFullBytes] & finalByte);
      } else {
        return true;
      }
    }
  }

  parseAddress(address: string): Address | never {
    try {
      const addressAsArray = address.split('.').map(octet => parseInt(octet));
      return {
        address: addressAsArray,
        equals: other => other.address.every((octet, i) => octet === addressAsArray[i]),
      };
    } catch (err) {
      throw new Error(`Failed to parse address ${address}`);
    }
  }
}
