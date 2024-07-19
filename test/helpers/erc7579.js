const { ethers } = require('hardhat');

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

/// TODO
// const encodeBatch =

module.exports = {
  encodeMode,
  encodeSingle,
};
