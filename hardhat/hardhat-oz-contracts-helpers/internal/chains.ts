import { ethers } from 'ethers';
import { addressCoder } from 'interoperable-addresses';

import type { InteroperableAddress } from 'interoperable-addresses';

// Does not support async getters that are part of ethers.AddressLike (Addressable and Promise<string>)
function extractAddress(entity: any): string {
  if (typeof entity === 'string') {
    return ethers.getAddress(entity);
  } else if ('address' in entity) {
    return extractAddress(entity.address);
  } else if ('target' in entity) {
    return extractAddress(entity.target);
  }
  throw new Error('Invalid address-like entity. Async getters are not supported.');
}

export const format = (addr: InteroperableAddress) => ({
  namespace: addr.chainType,
  reference: addr.reference?.toString(),
  caip2: `${addr.chainType}:${addr.reference}`,
  erc7930: addressCoder.encode(addr),
  toCaip10: (other: any) => `${addr.chainType}:${addr.reference}:${extractAddress(other)}`,
  toErc7930: (other: any) => addressCoder.encode({ ...addr, address: extractAddress(other) }),
});
