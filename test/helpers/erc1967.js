const { getStorageAt, setStorageAt } = require('@nomicfoundation/hardhat-network-helpers');

const ImplementationLabel = 'eip1967.proxy.implementation';
const AdminLabel = 'eip1967.proxy.admin';
const BeaconLabel = 'eip1967.proxy.beacon';

function labelToSlot(label) {
  return '0x' + web3.utils.toBN(web3.utils.keccak256(label)).subn(1).toString(16);
}

function getSlot(address, slot) {
  return getStorageAt(
    web3.utils.isAddress(address) ? address : address.address,
    web3.utils.isHex(slot) ? slot : labelToSlot(slot),
  );
}

function setSlot(address, slot, value) {
  const hexValue = web3.utils.isHex(value) ? value : web3.utils.toHex(value);

  return setStorageAt(
    web3.utils.isAddress(address) ? address : address.address,
    web3.utils.isHex(slot) ? slot : labelToSlot(slot),
    web3.utils.padLeft(hexValue, 64),
  );
}

async function getAddressInSlot(address, slot) {
  const slotValue = await getSlot(address, slot);
  return web3.utils.toChecksumAddress(slotValue.substring(slotValue.length - 40));
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
