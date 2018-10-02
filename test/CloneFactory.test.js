const ERC20Mock = artifacts.require('ERC20Mock');
const ERC20CloneFactory = artifacts.require('ERC20CloneFactory');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CloneFactory', function ([_, owner]) {
  let expectedCloneBytecode;
  let cloneOne;
  let cloneTwo;
  let factory;

  const UPDATE_VALUE = 32;
  const INIT_SUPPLY_ONE = 128;
  const INIT_SUPPLY_TWO = 512;

  // Expected bytecode for clones refers to https://eips.ethereum.org/EIPS/eip-1167 and should be
  // concatenation of '0x363d3d373d3d3d363d73 + masterAddress + 5af43d82803e903d91602b57fd5bf3'
  const EXPECTED_BYTECODE_PREFIX = '0x363d3d373d3d3d363d73';
  const EXPECTED_BYTECODE_SUFFIX = '5af43d82803e903d91602b57fd5bf3';

  describe('factory initialized', function () {
    before(async function () {
      await initFactory(ERC20CloneFactory);
    });

    describe('cloned instances created', function () {
      before(async function () {
        cloneOne = await factory.createNew(INIT_SUPPLY_ONE, { from: owner });
        cloneTwo = await factory.createNew(INIT_SUPPLY_TWO, { from: owner });
      });

      it('proxy clones should have correct coresponding bytecode', async function () {
        (await readContractCode(cloneOne.address)).should.be.equal(expectedCloneBytecode);
        (await readContractCode(cloneTwo.address)).should.be.equal(expectedCloneBytecode);
      });

      it('should have correct state after init', async function () {
        (await cloneOne.totalSupply()).should.be.bignumber.equal(INIT_SUPPLY_ONE);
        (await cloneTwo.totalSupply()).should.be.bignumber.equal(INIT_SUPPLY_TWO);
      });

      describe('after updates', function () {
        before(async function () {
          await cloneOne.mint(owner, UPDATE_VALUE);
          await cloneTwo.mint(owner, UPDATE_VALUE * 2);
        });

        it('clones should have correct state', async function () {
          (await cloneOne.totalSupply()).should.be.bignumber.equal(INIT_SUPPLY_ONE + UPDATE_VALUE);
          (await cloneTwo.totalSupply()).should.be.bignumber.equal(INIT_SUPPLY_TWO + (UPDATE_VALUE * 2));
        });
      });
    });
  });

  const initFactory = async function (factoryContract) {
    const _factory = await factoryContract.new();
    factory = {
      createNew: async function (amount) {
        const tx = await _factory.createNew(amount);
        const masterAddress = tx.logs[0].args.masterAddress;

        // Prepare expected value of bytecode containing master contract address
        expectedCloneBytecode = EXPECTED_BYTECODE_PREFIX + masterAddress.substring(2) + EXPECTED_BYTECODE_SUFFIX;

        return ERC20Mock.at(tx.logs[0].args.clonedAddress);
      }
    };
  };

  const readContractCode = async function (contractAddress) {
    return web3.eth.getCode(contractAddress);
  };
});
