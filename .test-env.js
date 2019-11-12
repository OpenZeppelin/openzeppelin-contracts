const { GSNDevProvider } = require('@openzeppelin/gsn-provider');

module.exports = {
  accounts: {
    ether: 1e6,
  },

  gasLimit: 8e6,

  setupProvider: (baseProvider) => {
    const { accounts } = require('@openzeppelin/test-env');

    return new GSNDevProvider(baseProvider, {
      txfee: 70,
      useGSN: false,
      ownerAddress: accounts[8],
      relayerAddress: accounts[9],
    });
  },
};
