class IPRangeMatcher {
  constructor(ipAddress) {
    if (ipAddress.indexOf('/') > 0) {
      const [address, mask] = ipAddress.split('/');
      this.ipAddress = address;
      this.nMaskBits = parseInt(mask);
    } else {
      this.ipAddress = ipAddress;
      this.nMaskBits = -1;
    }

    this.requiredAddress = this.parseAddress(this.ipAddress);
  }

  matches(address) {
    var remoteAddress;
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
      const finalByte = (0xff00 >> (this.nMaskBits % 8)) & 0xff;

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

  parseAddress(address) {
    try {
      return {
        address: address.split('.').map(Number),
        equals: (other) => other.address.every((v, i) => v === this.address[i])
      };
    } catch (err) {
      throw new Error(`Failed to parse address ${address}`);
    }
  }
}

