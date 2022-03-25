const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const InitializableMock = artifacts.require('InitializableMock');
const ConstructorInitializableMock = artifacts.require('ConstructorInitializableMock');
const ReinitializerMock = artifacts.require('ReinitializerMock');
const SampleChild = artifacts.require('SampleChild');

contract('Initializable', function (accounts) {
  describe('basic testing without inheritance', function () {
    beforeEach('deploying', async function () {
      this.contract = await InitializableMock.new();
    });

    context('before initialize', function () {
      it('initializer has not run', async function () {
        expect(await this.contract.initializerRan()).to.equal(false);
      });
    });

    context('after initialize', function () {
      beforeEach('initializing', async function () {
        await this.contract.initialize();
      });

      it('initializer has run', async function () {
        expect(await this.contract.initializerRan()).to.equal(true);
      });

      it('initializer does not run again', async function () {
        await expectRevert(this.contract.initialize(), 'Initializable: contract is already initialized');
      });
    });

    context('nested under an initializer', function () {
      it('initializer modifier reverts', async function () {
        await expectRevert(this.contract.initializerNested(), 'Initializable: contract is already initialized');
      });

      it('onlyInitializing modifier succeeds', async function () {
        await this.contract.onlyInitializingNested();
        expect(await this.contract.onlyInitializingRan()).to.equal(true);
      });
    });

    it('cannot call onlyInitializable function outside the scope of an initializable function', async function () {
      await expectRevert(this.contract.initializeOnlyInitializing(), 'Initializable: contract is not initializing');
    });
  });

  it('nested initializer can run during construction', async function () {
    const contract2 = await ConstructorInitializableMock.new();
    expect(await contract2.initializerRan()).to.equal(true);
    expect(await contract2.onlyInitializingRan()).to.equal(true);
  });

  describe('reinitialization', function () {
    beforeEach('deploying', async function () {
      this.contract = await ReinitializerMock.new();
    });

    it('can reinitialize', async function () {
      expect(await this.contract.counter()).to.be.bignumber.equal('0');
      await this.contract.initialize();
      expect(await this.contract.counter()).to.be.bignumber.equal('1');
      await this.contract.reinitialize(2);
      expect(await this.contract.counter()).to.be.bignumber.equal('2');
      await this.contract.reinitialize(3);
      expect(await this.contract.counter()).to.be.bignumber.equal('3');
    });

    it('can jump multiple steps', async function () {
      expect(await this.contract.counter()).to.be.bignumber.equal('0');
      await this.contract.initialize();
      expect(await this.contract.counter()).to.be.bignumber.equal('1');
      await this.contract.reinitialize(128);
      expect(await this.contract.counter()).to.be.bignumber.equal('2');
    });

    it('cannot nest reinitializers', async function () {
      expect(await this.contract.counter()).to.be.bignumber.equal('0');
      await expectRevert(this.contract.nestedReinitialize(2, 3), 'Initializable: contract is already initialized');
      await expectRevert(this.contract.nestedReinitialize(3, 2), 'Initializable: contract is already initialized');
    });

    it('can chain reinitializers', async function () {
      expect(await this.contract.counter()).to.be.bignumber.equal('0');
      await this.contract.chainReinitialize(2, 3);
      expect(await this.contract.counter()).to.be.bignumber.equal('2');
    });

    describe('contract locking', function () {
      it('prevents initialization', async function () {
        await this.contract.disableInitializers();
        await expectRevert(this.contract.initialize(), 'Initializable: contract is already initialized');
      });

      it('prevents re-initialization', async function () {
        await this.contract.disableInitializers();
        await expectRevert(this.contract.reinitialize(255), 'Initializable: contract is already initialized');
      });

      it('can lock contract after initialization', async function () {
        await this.contract.initialize();
        await this.contract.disableInitializers();
        await expectRevert(this.contract.reinitialize(255), 'Initializable: contract is already initialized');
      });
    });
  });

  describe('complex testing with inheritance', function () {
    const mother = '12';
    const gramps = '56';
    const father = '34';
    const child = '78';

    beforeEach('deploying', async function () {
      this.contract = await SampleChild.new();
    });

    beforeEach('initializing', async function () {
      await this.contract.initialize(mother, gramps, father, child);
    });

    it('initializes human', async function () {
      expect(await this.contract.isHuman()).to.be.equal(true);
    });

    it('initializes mother', async function () {
      expect(await this.contract.mother()).to.be.bignumber.equal(mother);
    });

    it('initializes gramps', async function () {
      expect(await this.contract.gramps()).to.be.bignumber.equal(gramps);
    });

    it('initializes father', async function () {
      expect(await this.contract.father()).to.be.bignumber.equal(father);
    });

    it('initializes child', async function () {
      expect(await this.contract.child()).to.be.bignumber.equal(child);
    });
  });
});
