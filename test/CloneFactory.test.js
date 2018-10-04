const SimpleToken = artifacts.require('SimpleToken');
const SimpleCloneFactory = artifacts.require('SimpleCloneFactory');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CloneFactory', function ([_, owner]) {
  let factory;

  describe('factory initialized', function () {
    beforeEach(async function () {
      factory = await initFactory();
    });

    it('should create proxy contract with valid bytecode', async function () {
      const proxy = await factory.createNew();
      (await readContractCode(proxy.address)).should.be.equal(expectedBytcode());
    });
  });

  const initFactory = async function () {
    const _factory = await SimpleCloneFactory.new();
    const _originAddress = await _factory.originAddress();
    return {
      createNew: async function () {
        const tx = await _factory.createNew();
        return SimpleToken.at(tx.logs[0].args.clonedAddress);
      },
      originAddress: function () {
        return _originAddress;
      },
    };
  };

  const readContractCode = async function (contractAddress) {
    return web3.eth.getCode(contractAddress);
  };

  const expectedBytcode = function () {
    const originAddress = factory.originAddress();
    return '0x363d3d373d3d3d363d73' + originAddress.substring(2) + '5af43d82803e903d91602b57fd5bf3';
  };
});
