usePlugin('solidity-coverage');
usePlugin('@nomiclabs/buidler-truffle5');

extendEnvironment(hre => {
  const { contract } = hre;
  hre.contract = function (name, body) {
    contract(name, accounts => body(accounts.slice(1)));
  };
});

module.exports = {
  networks: {
    buidlerevm: {
      blockGasLimit: 10000000,
    },
  },
  solc: {
    version: '0.6.12',
  },
};
