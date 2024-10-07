const { ethers } = require('hardhat');

const MODULE_TYPE_VALIDATOR = 1;
const MODULE_TYPE_EXECUTOR = 2;
const MODULE_TYPE_FALLBACK = 3;
const MODULE_TYPE_HOOK = 4;

const encodeMode = ({
  callType = '0x00',
  execType = '0x00',
  selector = '0x00000000',
  payload = '0x00000000000000000000000000000000000000000000',
} = {}) =>
  ethers.solidityPacked(
    ['bytes1', 'bytes1', 'bytes4', 'bytes4', 'bytes22'],
    [callType, execType, '0x00000000', selector, payload],
  );

const encodeSingle = (target, value = 0n, data = '0x') =>
  ethers.solidityPacked(['address', 'uint256', 'bytes'], [target.target ?? target.address ?? target, value, data]);

const encodeBatch = (...entries) =>
  ethers.AbiCoder.defaultAbiCoder().encode(
    ['(address,uint256,bytes)[]'],
    [
      entries.map(entry =>
        Array.isArray(entry)
          ? [entry[0].target ?? entry[0].address ?? entry[0], entry[1] ?? 0n, entry[2] ?? '0x']
          : [entry.target.target ?? entry.target.address ?? entry.target, entry.value ?? 0n, entry.data ?? '0x'],
      ),
    ],
  );

module.exports = {
  encodeMode,
  encodeSingle,
  encodeBatch,
  MODULE_TYPE_VALIDATOR,
  MODULE_TYPE_EXECUTOR,
  MODULE_TYPE_FALLBACK,
  MODULE_TYPE_HOOK,
};
