import { ethers } from 'ethers';
import { EIP712Domain } from './eip712-types';

export * from './eip712-types';

export async function getDomain(contract) {
  const { fields, name, version, chainId, verifyingContract, salt, extensions } = await contract.eip712Domain();

  if (extensions.length > 0) {
    throw Error('Extensions not implemented');
  }

  const domain = {
    name,
    version,
    chainId,
    verifyingContract,
    salt,
  };

  for (const [i, { name }] of EIP712Domain.entries()) {
    if (!(fields & (1 << i))) {
      delete domain[name];
    }
  }

  return domain;
}

export function domainType(domain) {
  return EIP712Domain.filter(({ name }) => domain[name] !== undefined);
}

export const domainSeparator = ethers.TypedDataEncoder.hashDomain;

export function hashTypedData(domain, structHash) {
  return ethers.solidityPackedKeccak256(
    ['bytes', 'bytes32', 'bytes32'],
    ['0x1901', ethers.TypedDataEncoder.hashDomain(domain), structHash],
  );
}
