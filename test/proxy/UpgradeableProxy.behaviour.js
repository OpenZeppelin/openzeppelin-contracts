const { contract, web3 } = require('@openzeppelin/test-environment');

const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { toChecksumAddress, keccak256 } = require('ethereumjs-util');

const { expect } = require('chai');

const DummyImplementation = contract.fromArtifact('DummyImplementation');

const IMPLEMENTATION_LABEL = 'eip1967.proxy.implementation';

module.exports = function shouldBehaveLikeUpgradeableProxy (createProxy, proxyAdminAddress, proxyCreator) {
  it('cannot be initialized with a non-contract address', async function () {
    const nonContractAddress = proxyCreator;
    const initializeData = Buffer.from('');
    await expectRevert.unspecified(
      createProxy(nonContractAddress, proxyAdminAddress, initializeData, {
        from: proxyCreator,
      }),
    );
  });

  before('deploy implementation', async function () {
    this.implementation = web3.utils.toChecksumAddress((await DummyImplementation.new()).address);
  });

  const assertProxyInitialization = function ({ value, balance }) {
    it('sets the implementation address', async function () {
      const slot = '0x' + new BN(keccak256(Buffer.from(IMPLEMENTATION_LABEL))).subn(1).toString(16);
      const implementation = toChecksumAddress(await web3.eth.getStorageAt(this.proxy, slot));
      expect(implementation).to.be.equal(this.implementation);
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
        this.proxy = (
          await createProxy(this.implementation, proxyAdminAddress, initializeData, {
            from: proxyCreator,
          })
        ).address;
      });

      assertProxyInitialization({ value: 0, balance: 0 });
    });

    describe('when sending some balance', function () {
      const value = 10e5;

      beforeEach('creating proxy', async function () {
        this.proxy = (
          await createProxy(this.implementation, proxyAdminAddress, initializeData, {
            from: proxyCreator,
            value,
          })
        ).address;
      });

      assertProxyInitialization({ value: 0, balance: value });
    });
  });

  describe('initialization without parameters', function () {
    describe('non payable', function () {
      const expectedInitializedValue = 10;
      const initializeData = new DummyImplementation('').contract.methods['initializeNonPayable()']().encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        it('reverts', async function () {
          await expectRevert.unspecified(
            createProxy(this.implementation, proxyAdminAddress, initializeData, { from: proxyCreator, value }),
          );
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = 100;
      const initializeData = new DummyImplementation('').contract.methods['initializePayable()']().encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        beforeEach('creating proxy', async function () {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
              value,
            })
          ).address;
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
      const initializeData = new DummyImplementation('').contract
        .methods['initializeNonPayable(uint256)'](expectedInitializedValue).encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        it('reverts', async function () {
          await expectRevert.unspecified(
            createProxy(this.implementation, proxyAdminAddress, initializeData, { from: proxyCreator, value }),
          );
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = 42;
      const initializeData = new DummyImplementation('').contract
        .methods['initializePayable(uint256)'](expectedInitializedValue).encodeABI();

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5;

        beforeEach('creating proxy', async function () {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
              value,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });
  });
};
