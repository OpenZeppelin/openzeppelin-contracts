// Remove the default account from the accounts list used in tests, in order
// to protect tests against accidentally passing due to the contract
// deployer being used subsequently as function caller
//
// This operation affects:
// - the accounts (and signersAsPromise) parameters of `contract` blocks
// - the return of hre.ethers.getSigners()
extendEnvironment(hre => {
  // TODO: replace with a mocha root hook.
  // (see https://github.com/sc-forks/solidity-coverage/issues/819#issuecomment-1762963679)
  if (!process.env.COVERAGE) {
    // override hre.ethers.getSigner()
    // note that we don't just discard the first signer, we also cache the value to improve speed.
    const originalGetSigners = hre.ethers.getSigners;
    const filteredSignersAsPromise = originalGetSigners().then(signers => signers.slice(1));
    hre.ethers.getSigners = () => filteredSignersAsPromise;
  }
});
