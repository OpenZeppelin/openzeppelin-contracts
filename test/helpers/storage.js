import { artifacts } from 'hardhat';
import { ethers } from 'ethers';

export const ImplementationLabel = 'eip1967.proxy.implementation';
export const AdminLabel = 'eip1967.proxy.admin';
export const BeaconLabel = 'eip1967.proxy.beacon';

export const erc1967Slot = label => ethers.toBeHex(ethers.toBigInt(ethers.id(label)) - 1n);
export const erc7201Slot = label => ethers.toBeHex(ethers.toBigInt(ethers.keccak256(erc1967Slot(label))) & ~0xffn);
export const erc7201format = contractName => `openzeppelin.storage.${contractName}`;

export const upgradeableSlot = (contractName, offset) =>
  artifacts.readArtifact(`${contractName}Upgradeable`).then(
    () => offset + ethers.toBigInt(erc7201Slot(erc7201format(contractName))),
    () => offset,
  );
