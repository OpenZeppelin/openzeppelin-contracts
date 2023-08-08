const MAX_UINT48 = web3.utils.toBN(1).shln(48).subn(1).toString();
const MAX_UINT64 = web3.utils.toBN(1).shln(64).subn(1).toString();

module.exports = {
  MAX_UINT48,
  MAX_UINT64,
};
