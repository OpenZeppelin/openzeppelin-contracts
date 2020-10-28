usePlugin('@nomiclabs/buidler-truffle5');

module.exports = {
  networks: {
    buidlerevm: {
      from: '0x26C43a1D431A4e5eE86cD55Ed7Ef9Edf3641e901',
      blockGasLimit: 10000000,
    },
  },
  solc: {
    version: '0.6.12',
  },
};
