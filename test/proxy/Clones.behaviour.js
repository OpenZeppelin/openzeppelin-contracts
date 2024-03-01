const { ethers } = require('hardhat');
const { expect } = require('chai');

module.exports = function shouldBehaveLikeClone() {
  const assertProxyInitialization = function ({ value, balance }) {
    it('initializes the proxy', async function () {
      const dummy = await ethers.getContractAt('DummyImplementation', this.proxy);
      expect(await dummy.value()).to.equal(value);
    });

    it('has expected balance', async function () {
      expect(await ethers.provider.getBalance(this.proxy)).to.equal(balance);
    });
  };

  describe('construct with value', function () {
    const value = 10n;

    it('factory has enough balance', async function () {
      await this.deployer.sendTransaction({ to: this.factory, value });

      const instance = await this.createClone({ deployValue: value });
      await expect(instance.deploymentTransaction()).to.changeEtherBalances([this.factory, instance], [-value, value]);

      expect(await ethers.provider.getBalance(instance)).to.equal(value);
    });

    it('factory does not have enough balance', async function () {
      await expect(this.createClone({ deployValue: value }))
        .to.be.revertedWithCustomError(this.factory, 'InsufficientBalance')
        .withArgs(0n, value);
    });
  });

  describe('initialization without parameters', function () {
    describe('non payable', function () {
      const expectedInitializedValue = 10n;

      beforeEach(async function () {
        this.initializeData = await this.implementation.interface.encodeFunctionData('initializeNonPayable');
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = await this.createClone({ initData: this.initializeData });
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10n ** 6n;

        it('reverts', async function () {
          await expect(this.createClone({ initData: this.initializeData, initValue: value })).to.be.reverted;
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = 100n;

      beforeEach(async function () {
        this.initializeData = await this.implementation.interface.encodeFunctionData('initializePayable');
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = await this.createClone({ initData: this.initializeData });
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10n ** 6n;

        beforeEach('creating proxy', async function () {
          this.proxy = await this.createClone({ initData: this.initializeData, initValue: value });
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

      beforeEach(async function () {
        this.initializeData = await this.implementation.interface.encodeFunctionData('initializeNonPayableWithValue', [
          expectedInitializedValue,
        ]);
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = await this.createClone({ initData: this.initializeData });
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10n ** 6n;

        it('reverts', async function () {
          await expect(this.createClone({ initData: this.initializeData, initValue: value })).to.be.reverted;
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
          this.proxy = await this.createClone({ initData: this.initializeData });
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10n ** 6n;

        beforeEach('creating proxy', async function () {
          this.proxy = await this.createClone({ initData: this.initializeData, initValue: value });
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });
  });
};
