const { RelayProvider } = require('tabookey-gasless');

function convertToGSN (instance, options = { txfee: 0, verbose: false }) {
  // truffle-contract instances don't each have their own provider: rather, they go through their parent's (the
  // 'contract abstraction'). We therefore need to create a new contract abstraction, configure it to use the relay
  // provider, and create a new contract instance for that abstraction.

  // Contract abstractions have a .clone method that copies all values for a new network id (the same one, in this
  // case), except the class_defaults (e.g. default from address), so we manually copy that one.
  const gsnifiedAbstraction = instance.constructor.clone(instance.constructor.network_id);
  /* eslint-disable-next-line camelcase */
  gsnifiedAbstraction.class_defaults = Object.assign({}, instance.constructor.class_defaults);

  gsnifiedAbstraction.setProvider(new RelayProvider(web3.eth.currentProvider, options));

  return gsnifiedAbstraction.at(instance.address);
}

module.exports = convertToGSN;
