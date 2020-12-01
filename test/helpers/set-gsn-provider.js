const { GSNDevProvider } = require('@openzeppelin/gsn-provider');

function setGSNProvider (Contract, accounts) {
  const baseProvider = Contract.currentProvider;
  Contract.setProvider(
    new GSNDevProvider(baseProvider, {
      txfee: 70,
      useGSN: false,
      ownerAddress: accounts[8],
      relayerAddress: accounts[9],
    }),
  );
};

module.exports = { setGSNProvider };
