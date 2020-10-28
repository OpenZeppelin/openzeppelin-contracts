usePlugin('solidity-coverage');
usePlugin('@nomiclabs/buidler-truffle5');

extendEnvironment(hre => {
  const { contract } = hre;
  hre.contract = function (name, body) {
    // remove the default account from the accounts list used in tests, in order
    // to protect tests against accidentally passing due to the contract
    // deployer being used subsequently as function caller
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
