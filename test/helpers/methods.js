import { ethers } from 'ethers';

export const selector = signature => ethers.FunctionFragment.from(signature).selector;

export const interfaceId = signatures =>
  ethers.toBeHex(
    signatures.reduce((acc, signature) => acc ^ ethers.toBigInt(selector(signature)), 0n),
    4,
  );
