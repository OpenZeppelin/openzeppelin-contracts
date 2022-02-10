const { ethers } = require('hardhat');

async function getFactory (name, opts = {}) {
  return ethers.getContractFactory(name).then(contract => contract.connect(opts.signer || contract.signer));
}

function attach (name, address, opts = {}) {
  return getFactory(name, opts).then(factory => factory.attach(address));
}

function deploy (name, args = [], opts = {}) {
  if (!Array.isArray(args)) { opts = args; args = []; }
  return getFactory(name, opts).then(factory => factory.deploy(...args)).then(contract => contract.deployed());
}

function withCrossChainMock (bridge) {
  switch (bridge) {
  case 'AMB':
    before(async function () {
      this.bridge = await deploy('BridgeAMBMock');
    });
    return;

  case 'Arbitrum-L1':
    before(async function () {
      this.bridge = await deploy('BridgeArbitrumL1Mock');
    });
    return;

  case 'Arbitrum-L2':
    before(async function () {
      await deploy('BridgeArbitrumL2Mock')
        .then(instance => ethers.provider.getCode(instance.address))
        .then(code => ethers.provider.send('hardhat_setCode', [ '0x0000000000000000000000000000000000000064', code ]));

      this.bridge = await attach('BridgeArbitrumL2Mock', '0x0000000000000000000000000000000000000064');
    });
    return;

  case 'Optimism':
    before(async function () {
      this.bridge = await deploy('BridgeOptimismMock');
    });
    return;

  default:
    throw new Error(`CrossChain: ${bridge} is not supported`);
  }
}

module.exports = {
  getFactory,
  attach,
  deploy,
  withCrossChainMock,
};
