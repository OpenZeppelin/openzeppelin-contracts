require('@nomiclabs/hardhat-truffle5');

module.exports = {
  networks: {
    hardhat: {
      from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      blockGasLimit: 10000000,
    },
  },
  solidity: {
    version: '0.6.12',
  },
};
