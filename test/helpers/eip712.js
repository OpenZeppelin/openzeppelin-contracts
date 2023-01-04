const ethSigUtil = require('eth-sig-util');
const keccak256 = require('keccak256');

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const Permit = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];

function bufferToHexString(buffer) {
  return '0x' + buffer.toString('hex');
}

function hexStringToBuffer(hexstr) {
  return Buffer.from(hexstr.replace(/^0x/, ''), 'hex');
}

async function domainSeparator({ name, version, chainId, verifyingContract }) {
  return bufferToHexString(
    ethSigUtil.TypedDataUtils.hashStruct(
      'EIP712Domain',
      { name, version, chainId, verifyingContract },
      { EIP712Domain },
    ),
  );
}

async function hashTypedData(domain, structHash) {
  return domainSeparator(domain).then(separator =>
    bufferToHexString(keccak256(Buffer.concat(['0x1901', separator, structHash].map(str => hexStringToBuffer(str))))),
  );
}

module.exports = {
  EIP712Domain,
  Permit,
  domainSeparator,
  hashTypedData,
};
