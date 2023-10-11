extendEnvironment(env => {
  const { contract } = env;

  const signers = env.ethers.getSigners();

  env.contract = function (name, body) {
    const { takeSnapshot } = require('@nomicfoundation/hardhat-network-helpers');

    contract(name, accounts => {
      // reset the state of the chain in between contract test suites
      let snapshot;
      // remove the default account from the accounts list used in tests, in order
      // to protect tests against accidentally passing due to the contract
      // deployer being used subsequently as function caller
      const filteredAccounts = accounts.slice(1);
      const filteredSigners = signers.then(signers => signers.slice(1));

      before(async function () {
        snapshot = await takeSnapshot();
      });

      after(async function () {
        await snapshot.restore();
      });

      body(filteredAccounts, filteredSigners);
    });
  };
});
