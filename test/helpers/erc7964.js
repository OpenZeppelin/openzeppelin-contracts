import { ethers } from 'ethers';
import { EIP712Domain, formatType } from './eip712-types';

export const ERC7964_MAGIC = '0x796479647964796479';

export const SetValue = formatType({ operations: 'ChainOperation[]', nonce: 'uint256' });
export const ChainOperation = formatType({ domain: 'EIP712ChainDomain', value: 'uint256' });
export const EIP712ChainDomain = formatType({ chainId: 'uint256', verifyingContract: 'address' });

export function encodeHeader({ magic = ERC7964_MAGIC, fields, structIndex, application }) {
  return ethers.solidityPacked(['bytes9', 'bytes1', 'uint16', 'address'], [magic, fields, structIndex, application]);
}

export function encodeSignature({ header, structsArray, crossChainSignature }) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'bytes32[]', 'bytes'],
    [header, structsArray, crossChainSignature],
  );
}

// Returns the EIP-712 domain of `application` restricted to the ERC-5267 `fields` of a crosschain signature
export async function getCrossChainDomain(application, fields) {
  const { name, version, chainId, verifyingContract, salt } = await application.eip712Domain();
  const domain = { name, version, chainId, verifyingContract, salt };
  return Object.fromEntries(
    EIP712Domain.filter((_, i) => ethers.toNumber(fields) & (1 << i)).map(({ name }) => [name, domain[name]]),
  );
}
