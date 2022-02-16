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

class CrossChainHelper {
  before (type = 'Arbitrum-L2') {
    const that = this;
    switch (type) {
    case 'AMB':
      before(async function () {
        that.bridge = await deploy('BridgeAMBMock');
      });
      return;

    case 'Arbitrum-L1':
      before(async function () {
        that.bridge = await deploy('BridgeArbitrumL1Mock');
      });
      return;

    case 'Arbitrum-L2':
      before(async function () {
        await deploy('BridgeArbitrumL2Mock')
          .then(instance => ethers.provider.getCode(instance.address))
          .then(code => ethers.provider.send(
            'hardhat_setCode',
            [ '0x0000000000000000000000000000000000000064', code ],
          ));

        that.bridge = await attach('BridgeArbitrumL2Mock', '0x0000000000000000000000000000000000000064');
      });
      return;

    case 'Optimism':
      before(async function () {
        that.bridge = await deploy('BridgeOptimismMock');
      });
      return;

    case 'Polygon-Child':
      before(async function () {
        that.bridge = await deploy('BridgePolygonChildMock');
      });
      return;

    default:
      throw new Error(`CrossChain: ${type} is not supported`);
    }
  }

  call (from, target, selector = undefined, args = []) {
    return this.bridge.relayAs(
      target.address || target,
      selector
        ? target.interface.encodeFunctionData(selector, ...args)
        : '0x',
      from,
    );
  }
}

module.exports = {
  CrossChainHelper,
  getFactory,
  attach,
  deploy,
};
