const { ethers } = require('hardhat');
const { setStorageAt } = require('@nomicfoundation/hardhat-network-helpers');

const ImplementationLabel = 'eip1967.proxy.implementation';
const AdminLabel = 'eip1967.proxy.admin';
const BeaconLabel = 'eip1967.proxy.beacon';

const erc1967slot = label => ethers.toBeHex(ethers.toBigInt(ethers.id(label)) - 1n);
const erc7201slot = label => ethers.toBeHex(ethers.toBigInt(ethers.keccak256(erc1967slot(label))) & ~0xffn);
const erc7201format = contractName => `openzeppelin.storage.${contractName}`;

const getSlot = (address, slot) =>
  ethers.provider.getStorage(address, ethers.isBytesLike(slot) ? slot : erc1967slot(slot));

const setSlot = (address, slot, value) =>
  Promise.all([
    ethers.isAddressable(address) ? address.getAddress() : Promise.resolve(address),
    ethers.isAddressable(value) ? value.getAddress() : Promise.resolve(value),
  ]).then(([address, value]) => setStorageAt(address, ethers.isBytesLike(slot) ? slot : erc1967slot(slot), value));

const getAddressInSlot = (address, slot) =>
  getSlot(address, slot).then(slotValue => ethers.AbiCoder.defaultAbiCoder().decode(['address'], slotValue)[0]);

const upgradeableSlot = (contractName, offset) => {
  try {
    // Try to get the artifact paths, will throw if it doesn't exist
    artifacts._getArtifactPathSync(`${contractName}Upgradeable`);
    return offset + ethers.toBigInt(erc7201slot(erc7201format(contractName)));
  } catch (_) {
    return offset;
  }
};

module.exports = {
  ImplementationLabel,
  AdminLabel,
  BeaconLabel,
  ImplementationSlot: erc1967slot(ImplementationLabel),
  AdminSlot: erc1967slot(AdminLabel),
  BeaconSlot: erc1967slot(BeaconLabel),
  erc1967slot,
  erc7201slot,
  erc7201format,
  setSlot,
  getSlot,
  getAddressInSlot,
  upgradeableSlot,
};
