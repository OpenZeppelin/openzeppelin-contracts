const { promisify } = require('util');

const BridgeAMBMock = artifacts.require('BridgeAMBMock');
const BridgeArbitrumL1Mock = artifacts.require('BridgeArbitrumL1Mock');
const BridgeArbitrumL2Mock = artifacts.require('BridgeArbitrumL2Mock');
const BridgeOptimismMock = artifacts.require('BridgeOptimismMock');

function withCrossChainMock (bridge) {
  switch (bridge) {
  case 'AMB':
    before(async function () {
      this.bridge = await BridgeAMBMock.new();
    });
    return;

  case 'Arbitrum-L1':
    before(async function () {
      this.bridge = await BridgeArbitrumL1Mock.new();
    });
    return;

  case 'Arbitrum-L2':
    before(async function () {
      await BridgeArbitrumL2Mock.new()
        .then(instance => web3.eth.getCode(instance.address))
        .then(code => promisify(web3.currentProvider.send.bind(web3.currentProvider))({
          jsonrpc: '2.0',
          method: 'hardhat_setCode',
          params: [ '0x0000000000000000000000000000000000000064', code ],
          id: new Date().getTime(),
        }));

      this.bridge = await BridgeArbitrumL2Mock.at('0x0000000000000000000000000000000000000064');
    });
    return;

  case 'Optimism':
    before(async function () {
      this.bridge = await BridgeOptimismMock.new();
    });
    return;

  default:
    throw new Error(`CrossChain: ${bridge} is not supported`);
  }
}

module.exports = {
  withCrossChainMock,
};
