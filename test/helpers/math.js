module.exports = {
  sum: inputs => inputs.reduce((acc, n) => acc + n, 0),
  BNsum: inputs => inputs.reduce((acc, n) => acc.add(n), web3.utils.toBN(0)),
};
