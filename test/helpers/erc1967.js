const { ethers } = require('hardhat');
const { getStorageAt, setStorageAt } = require('@nomicfoundation/hardhat-network-helpers');

const ImplementationLabel = 'eip1967.proxy.implementation';
const AdminLabel = 'eip1967.proxy.admin';
const BeaconLabel = 'eip1967.proxy.beacon';

function labelToSlot(label) {
  return ethers.toBeHex(BigInt(ethers.keccak256(ethers.toUtf8Bytes(label))) - 1n);
}

function getSlot(address, slot) {
  return getStorageAt(
    ethers.isAddress(address) ? address : address.address,
    ethers.isBytesLike(slot) ? slot : labelToSlot(slot),
  );
}

function setSlot(address, slot, value) {
  return setStorageAt(
    ethers.isAddress(address) ? address : address.address,
    ethers.isBytesLike(slot) ? slot : labelToSlot(slot),
    value,
  );
}

async function getAddressInSlot(address, slot) {
  const slotValue = await getSlot(address, slot);
  return ethers.getAddress(slotValue.substring(slotValue.length - 40));
}

module.exports = {
  ImplementationLabel,
  AdminLabel,
  BeaconLabel,
  ImplementationSlot: labelToSlot(ImplementationLabel),
  AdminSlot: labelToSlot(AdminLabel),
  BeaconSlot: labelToSlot(BeaconLabel),
  setSlot,
  getSlot,
  getAddressInSlot,
};
