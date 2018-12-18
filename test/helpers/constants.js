const BigNumber = web3.BigNumber;

module.exports = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  MAX_UINT256: new BigNumber(2).pow(256).minus(1),
  MAX_INT256: new BigNumber(2).pow(255).minus(1),
  MIN_INT256: new BigNumber(2).pow(255).times(-1),
};
