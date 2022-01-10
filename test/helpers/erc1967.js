const ImplementationLabel = 'eip1967.proxy.implementation';
const AdminLabel = 'eip1967.proxy.admin';
const BeaconLabel = 'eip1967.proxy.beacon';

function labelToSlot (label) {
  return '0x' + web3.utils.toBN(web3.utils.keccak256(label)).subn(1).toString(16);
}

function getSlot (address, slot) {
  return web3.eth.getStorageAt(
    web3.utils.isAddress(address) ? address : address.address,
    web3.utils.isHex(slot) ? slot : labelToSlot(slot),
  );
}

module.exports = {
  ImplementationLabel,
  AdminLabel,
  BeaconLabel,
  ImplementationSlot: labelToSlot(ImplementationLabel),
  AdminSlot: labelToSlot(AdminLabel),
  BeaconSlot: labelToSlot(BeaconLabel),
  getSlot,
};
