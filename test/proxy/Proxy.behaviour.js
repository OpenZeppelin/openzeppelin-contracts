const { ethers } = require('hardhat');
const { expect } = require('chai');

const { getAddressInSlot, ImplementationSlot } = require('../helpers/storage');

module.exports = function shouldBehaveLikeProxy() {
  it('cannot be initialized with a non-contract address', async function () {
    const initializeData = '0x';
    const contractFactory = await ethers.getContractFactory('ERC1967Proxy');
    await expect(this.createProxy(this.nonContractAddress, initializeData))
      .to.be.revertedWithCustomError(contractFactory, 'ERC1967InvalidImplementation')
      .withArgs(this.nonContractAddress);
  });

  it('reverts without initialization', async function () {
    const contractFactory = await ethers.getContractFactory('ERC1967Proxy');
    await expect(this.createProxy(this.implementation, '0x')).to.be.revertedWithCustomError(
      contractFactory,
      'ERC1967ProxyUninitialized',
    );
  });

  const assertProxyInitialization = function ({ value, balance }) {
    it('sets the implementation address', async function () {
      expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.implementation);
    });

    it('initializes the proxy', async function () {
      const dummy = this.implementation.attach(this.proxy);
      expect(await dummy.value()).to.equal(value);
    });

    it('has expected balance', async function () {
      expect(await ethers.provider.getBalance(this.proxy)).to.equal(balance);
    });
  };

  describe('initialization without parameters', function () {
    describe('non payable', function () {
      const expectedInitializedValue = 10n;

      beforeEach(function () {
        this.initializeData = this.implementation.interface.encodeFunctionData('initializeNonPayable');
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = await this.createProxy(this.implementation, this.initializeData);
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0n,
        });
      });

      describe('when sending some balance', function () {
        const value = 10n ** 5n;

        it('reverts', async function () {
          await expect(this.createProxy(this.implementation, this.initializeData, { value })).to.be.reverted;
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = 100n;

      beforeEach(function () {
        this.initializeData = this.implementation.interface.encodeFunctionData('initializePayable');
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = await this.createProxy(this.implementation, this.initializeData);
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0n,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        beforeEach('creating proxy', async function () {
          this.proxy = await this.createProxy(this.implementation, this.initializeData, { value });
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
      const expectedInitializedValue = 10n;

      beforeEach(function () {
        this.initializeData = this.implementation.interface.encodeFunctionData('initializeNonPayableWithValue', [
          expectedInitializedValue,
        ]);
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = await this.createProxy(this.implementation, this.initializeData);
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        it('reverts', async function () {
          await expect(this.createProxy(this.implementation, this.initializeData, { value })).to.be.reverted;
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = 42n;

      beforeEach(function () {
        this.initializeData = this.implementation.interface.encodeFunctionData('initializePayableWithValue', [
          expectedInitializedValue,
        ]);
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = await this.createProxy(this.implementation, this.initializeData);
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0n,
        });
      });

      describe('when sending some balance', function () {
        const value = 10n ** 5n;

        beforeEach('creating proxy', async function () {
          this.proxy = await this.createProxy(this.implementation, this.initializeData, { value });
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });

    describe('reverting initialization', function () {
      beforeEach(function () {
        this.initializeData = this.implementation.interface.encodeFunctionData('reverts');
      });

      it('reverts', async function () {
        await expect(this.createProxy(this.implementation, this.initializeData)).to.be.reverted;
      });
    });
  });
};
