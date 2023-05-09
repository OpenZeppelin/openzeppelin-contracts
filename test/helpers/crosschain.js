const { promisify } = require('util');

const BridgeAMBMock = artifacts.require('BridgeAMBMock');
const BridgeArbitrumL1Mock = artifacts.require('BridgeArbitrumL1Mock');
const BridgeArbitrumL2Mock = artifacts.require('BridgeArbitrumL2Mock');
const BridgeOptimismMock = artifacts.require('BridgeOptimismMock');
const BridgePolygonChildMock = artifacts.require('BridgePolygonChildMock');

class BridgeHelper {
  static async deploy(type) {
    return new BridgeHelper(await deployBridge(type));
  }

  constructor(bridge) {
    this.bridge = bridge;
    this.address = bridge.address;
  }

  call(from, target, selector = undefined, args = []) {
    return this.bridge.relayAs(
      target.address || target,
      selector ? target.contract.methods[selector](...args).encodeABI() : '0x',
      from,
    );
  }
}

async function deployBridge(type = 'Arbitrum-L2') {
  switch (type) {
    case 'AMB':
      return BridgeAMBMock.new();

    case 'Arbitrum-L1':
      return BridgeArbitrumL1Mock.new();

    case 'Arbitrum-L2': {
      const instance = await BridgeArbitrumL2Mock.new();
      const code = await web3.eth.getCode(instance.address);
      await promisify(web3.currentProvider.send.bind(web3.currentProvider))({
        jsonrpc: '2.0',
        method: 'hardhat_setCode',
        params: ['0x0000000000000000000000000000000000000064', code],
        id: new Date().getTime(),
      });
      return BridgeArbitrumL2Mock.at('0x0000000000000000000000000000000000000064');
    }

    case 'Optimism':
      return BridgeOptimismMock.new();

    case 'Polygon-Child':
      return BridgePolygonChildMock.new();

    default:
      throw new Error(`CrossChain: ${type} is not supported`);
  }
}

module.exports = {
  BridgeHelper,
};
