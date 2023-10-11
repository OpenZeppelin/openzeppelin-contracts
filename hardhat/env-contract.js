// Remove the default account from the accounts list used in tests, in order
// to protect tests against accidentally passing due to the contract
// deployer being used subsequently as function caller
//
// This operation affects:
// - the accounts (and signersAsPromise) parameters of `contract` blocks
// - the return of hre.ethers.getSigners()
extendEnvironment(hre => {
  // cache old version
  const { contract } = hre;
  const { getSigners } = hre.ethers;

  // cache the signer list, so that its resolved only once.
  const filteredSignersAsPromise = getSigners().then(signers => signers.slice(1));

  // override hre.ethers.getSigner()
  hre.ethers.getSigners = () => filteredSignersAsPromise;

  // override hre.contract
  hre.contract = (name, body) => {
    const { takeSnapshot } = require('@nomicfoundation/hardhat-network-helpers');

    contract(name, accounts => {
      // reset the state of the chain in between contract test suites
      // TODO: this should be removed when migration to ethers is over
      let snapshot;

      before(async function () {
        snapshot = await takeSnapshot();
      });

      after(async function () {
        await snapshot.restore();
      });

      body(accounts.slice(1), filteredSignersAsPromise);
    });
  };
});
