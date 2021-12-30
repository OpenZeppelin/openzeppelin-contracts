const { BN } = require('@openzeppelin/test-helpers');
const ethereumjsUtil = require('ethereumjs-util');

const ImplementationLabel = 'eip1967.proxy.implementation';
const AdminLabel = 'eip1967.proxy.admin';
const BeaconLabel = 'eip1967.proxy.beacon';

function labelToSlot (label) {
  return '0x' + new BN(ethereumjsUtil.keccak256(Buffer.from(label))).subn(1).toString(16);
}

function toChecksumAddress (address) {
  return ethereumjsUtil.toChecksumAddress('0x' + address.replace(/^0x/, '').padStart(40, '0'));
}

module.exports = {
  ImplementationLabel,
  AdminLabel,
  BeaconLabel,
  ImplementationSlot: labelToSlot(ImplementationLabel),
  AdminSlot: labelToSlot(AdminLabel),
  BeaconSlot: labelToSlot(BeaconLabel),
  toChecksumAddress,
};
