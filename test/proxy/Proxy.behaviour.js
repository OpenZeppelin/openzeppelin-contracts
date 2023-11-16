const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { expectRevert } = require('@openzeppelin/test-helpers');
const { getSlot, getAddressInSlot, ImplementationSlot } = require('../helpers/erc1967');

const { expectRevertCustomError } = require('../helpers/customError');

const DummyImplementation = artifacts.require('DummyImplementation');

module.exports = function shouldBehaveLikeProxy(createProxy, accounts) {
  const fixture = async () => {
    const [nonContractAddress] = await ethers.getSigners();

    const implementation = (await ethers.deployContract('DummyImplementation')).target;

    return {nonContractAddress, implementation};
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('cannot be initialized with a non-contract address', async function () {
    const initializeData = '0x';
    await expect(createProxy(this.nonContractAddress, initializeData)).to.be.reverted;
  });

  const assertProxyInitialization = function ({ value, balance }) {
    it('sets the implementation address', async function () {
      const implementationAddress = await getAddressInSlot(this.proxy, ImplementationSlot);
      expect(implementationAddress).to.be.equal(this.implementation.target);
    });

    it('initializes the proxy', async function () {
      const dummy = new DummyImplementation(this.proxy);
      expect(await dummy.value()).to.be.bignumber.equal(value.toString());
    });

    it('has expected balance', async function () {
      expect(await web3.eth.getBalance(this.proxy)).to.be.bignumber.equal(balance.toString());
    });
  };

  describe('without initialization', function () {
    const initializeData = Buffer.from('');

    describe('when not sending balance', function () {
      beforeEach('creating proxy', async function () {
        this.proxy = (await createProxy(this.implementation, initializeData)).address;
      });

      assertProxyInitialization({ value: 0, balance: 0 });
    });

    describe('when sending some balance', function () {
      const value = 10e5;

      it('reverts', async function () {
        await expectRevertCustomError(
          createProxy(this.implementation, initializeData, { value }),
          'ERC1967NonPayable',
          [],
        );
      });
    });
  });

  describe('initialization without parameters', function () {
    describe('non payable', function () {
      const expectedInitializedValue = 10;
      const initializeData = new DummyImplementation('').contract.methods['initializeNonPayable()']().encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await createProxy(this.implementation, initializeData)).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        it('reverts', async function () {
          await expectRevert.unspecified(createProxy(this.implementation, initializeData, { value }));
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = 100;
      const initializeData = new DummyImplementation('').contract.methods['initializePayable()']().encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await createProxy(this.implementation, initializeData)).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        beforeEach('creating proxy', async function () {
          this.proxy = (await createProxy(this.implementation, initializeData, { value })).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });
  });

  describe('initialization with parameters', function () {
    describe('non payable', function () {
      const expectedInitializedValue = 10;
      const initializeData = new DummyImplementation('').contract.methods
        .initializeNonPayableWithValue(expectedInitializedValue)
        .encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await createProxy(this.implementation, initializeData)).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        it('reverts', async function () {
          await expectRevert.unspecified(createProxy(this.implementation, initializeData, { value }));
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = 42;
      const initializeData = new DummyImplementation('').contract.methods
        .initializePayableWithValue(expectedInitializedValue)
        .encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await createProxy(this.implementation, initializeData)).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        beforeEach('creating proxy', async function () {
          this.proxy = (await createProxy(this.implementation, initializeData, { value })).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });

    describe('reverting initialization', function () {
      const initializeData = new DummyImplementation('').contract.methods.reverts().encodeABI();

      it('reverts', async function () {
        await expectRevert(createProxy(this.implementation, initializeData), 'DummyImplementation reverted');
      });
    });
  });
};
