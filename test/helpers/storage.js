import { artifacts } from 'hardhat';
import { ethers } from 'ethers';

export const ImplementationLabel = 'eip1967.proxy.implementation';
export const AdminLabel = 'eip1967.proxy.admin';
export const BeaconLabel = 'eip1967.proxy.beacon';

export const erc1967Slot = label => ethers.toBeHex(ethers.toBigInt(ethers.id(label)) - 1n);
export const erc7201Slot = label => ethers.toBeHex(ethers.toBigInt(ethers.keccak256(erc1967Slot(label))) & ~0xffn);
export const erc7201format = contractName => `openzeppelin.storage.${contractName}`;

export const getSlot =
  ({ networkHelpers }) =>
  (address, slot) =>
    (ethers.isAddressable(address) ? address.getAddress() : Promise.resolve(address)).then(address =>
      networkHelpers.getStorageAt(address, ethers.isBytesLike(slot) ? slot : erc1967Slot(slot)),
    );

export const getAddressInSlot =
  ({ networkHelpers }) =>
  (address, slot) =>
    getSlot({ networkHelpers })(address, slot).then(
      slotValue => ethers.AbiCoder.defaultAbiCoder().decode(['address'], slotValue)[0],
    );

export const setSlot =
  ({ networkHelpers }) =>
  (address, slot, value) =>
    Promise.all([
      ethers.isAddressable(address) ? address.getAddress() : Promise.resolve(address),
      ethers.isAddressable(value) ? value.getAddress() : Promise.resolve(value),
    ]).then(([address, value]) =>
      networkHelpers.setStorageAt(address, ethers.isBytesLike(slot) ? slot : erc1967Slot(slot), value),
    );

export const upgradeableSlot = (contractName, offset) =>
  artifacts.readArtifact(`${contractName}Upgradeable`).then(
    () => offset + ethers.toBigInt(erc7201Slot(erc7201format(contractName))),
    () => offset,
  );
