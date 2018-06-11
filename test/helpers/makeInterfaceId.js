import { soliditySha3 } from 'web3-utils';

const INTERFACE_ID_LENGTH = 4;

export default (interfaces = []) => {
  const interfaceIdBuffer = interfaces
    .map(methodSignature => soliditySha3(methodSignature)) // keccak256
    .map(h =>
      Buffer
        .from(h.substring(2), 'hex')
        .slice(0, 4) // bytes4()
    )
    .reduce((memo, bytes) => {
      for (let i = 0; i < INTERFACE_ID_LENGTH; i++) {
        memo[i] = memo[i] ^ bytes[i]; // xor
      }
      return memo;
    }, Buffer.alloc(INTERFACE_ID_LENGTH));

  return `0x${interfaceIdBuffer.toString('hex')}`;
};
