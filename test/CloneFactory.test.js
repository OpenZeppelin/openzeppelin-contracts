const ERC20Mock = artifacts.require('ERC20Mock');
const ERC20CloneFactory = artifacts.require('ERC20CloneFactory');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CloneFactory', function ([_, owner]) {
  let master;
  let clonedOne;
  let clonedTwo;
  let factory;

  const _masterSupply = 64;
  const _clonedSupplyOne = 128;
  const _clonedSupplyTwo = 512;
  const _updateValue = 32;

  const initFactory = async function (factoryContract) {
    const _factory = await factoryContract.new(master.address);
    factory = {
      createNew: async function (amount) {
        const tx = await _factory.createNew(amount);
        return ERC20Mock.at(tx.logs[0].args.cloneAddress);
      }
    };
  };

  describe('factory initialized with master contract', function () {
    before(async function () {
      master = await ERC20Mock.new(owner, _masterSupply);
      await initFactory(ERC20CloneFactory);
    });

    describe('cloned instances created', function () {
      before(async function () {
        clonedOne = await factory.createNew(_clonedSupplyOne, { from: owner });
        clonedTwo = await factory.createNew(_clonedSupplyTwo, { from: owner });
      });

      it('should have correct state after init', async function () {
        (await clonedOne.totalSupply()).should.be.bignumber.equal(_clonedSupplyOne);
        (await clonedTwo.totalSupply()).should.be.bignumber.equal(_clonedSupplyTwo);
      });

      describe('after updates', function () {
        before(async function () {
          await clonedOne.mint(owner, _updateValue);
          await clonedTwo.mint(owner, _updateValue * 2);
        });

        it('clones should have correct state', async function () {
          (await clonedOne.totalSupply()).should.be.bignumber.equal(_clonedSupplyOne + _updateValue);
          (await clonedTwo.totalSupply()).should.be.bignumber.equal(_clonedSupplyTwo + (_updateValue * 2));
        });

        it('master instance is immutable', async function () {
          (await master.totalSupply()).should.be.bignumber.equal(_masterSupply);
        });
      });
    });
  });
});
