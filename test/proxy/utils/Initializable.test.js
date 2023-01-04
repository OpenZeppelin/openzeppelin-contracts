const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const InitializableMock = artifacts.require('InitializableMock');
const ConstructorInitializableMock = artifacts.require('ConstructorInitializableMock');
const ChildConstructorInitializableMock = artifacts.require('ChildConstructorInitializableMock');
const ReinitializerMock = artifacts.require('ReinitializerMock');
const SampleChild = artifacts.require('SampleChild');
const DisableBad1 = artifacts.require('DisableBad1');
const DisableBad2 = artifacts.require('DisableBad2');
const DisableOk = artifacts.require('DisableOk');

contract('Initializable', function () {
  describe('basic testing without inheritance', function () {
    beforeEach('deploying', async function () {
      this.contract = await InitializableMock.new();
    });

    describe('before initialize', function () {
      it('initializer has not run', async function () {
        expect(await this.contract.initializerRan()).to.equal(false);
      });

      it('_initializing returns false before initialization', async function () {
        expect(await this.contract.isInitializing()).to.equal(false);
      });
    });

    describe('after initialize', function () {
      beforeEach('initializing', async function () {
        await this.contract.initialize();
      });

      it('initializer has run', async function () {
        expect(await this.contract.initializerRan()).to.equal(true);
      });

      it('_initializing returns false after initialization', async function () {
        expect(await this.contract.isInitializing()).to.equal(false);
      });

      it('initializer does not run again', async function () {
        await expectRevert(this.contract.initialize(), 'Initializable: contract is already initialized');
      });
    });

    describe('nested under an initializer', function () {
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

  it('multiple constructor levels can be initializers', async function () {
    const contract2 = await ChildConstructorInitializableMock.new();
    expect(await contract2.initializerRan()).to.equal(true);
    expect(await contract2.childInitializerRan()).to.equal(true);
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
      await expectRevert(this.contract.nestedReinitialize(2, 2), 'Initializable: contract is already initialized');
      await expectRevert(this.contract.nestedReinitialize(2, 3), 'Initializable: contract is already initialized');
      await expectRevert(this.contract.nestedReinitialize(3, 2), 'Initializable: contract is already initialized');
    });

    it('can chain reinitializers', async function () {
      expect(await this.contract.counter()).to.be.bignumber.equal('0');
      await this.contract.chainReinitialize(2, 3);
      expect(await this.contract.counter()).to.be.bignumber.equal('2');
    });

    it('_getInitializedVersion returns right version', async function () {
      await this.contract.initialize();
      expect(await this.contract.getInitializedVersion()).to.be.bignumber.equal('1');
      await this.contract.reinitialize(12);
      expect(await this.contract.getInitializedVersion()).to.be.bignumber.equal('12');
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

  describe('events', function () {
    it('constructor initialization emits event', async function () {
      const contract = await ConstructorInitializableMock.new();

      await expectEvent.inTransaction(contract.transactionHash, contract, 'Initialized', { version: '1' });
    });

    it('initialization emits event', async function () {
      const contract = await ReinitializerMock.new();

      const { receipt } = await contract.initialize();
      expect(receipt.logs.filter(({ event }) => event === 'Initialized').length).to.be.equal(1);
      expectEvent(receipt, 'Initialized', { version: '1' });
    });

    it('reinitialization emits event', async function () {
      const contract = await ReinitializerMock.new();

      const { receipt } = await contract.reinitialize(128);
      expect(receipt.logs.filter(({ event }) => event === 'Initialized').length).to.be.equal(1);
      expectEvent(receipt, 'Initialized', { version: '128' });
    });

    it('chained reinitialization emits multiple events', async function () {
      const contract = await ReinitializerMock.new();

      const { receipt } = await contract.chainReinitialize(2, 3);
      expect(receipt.logs.filter(({ event }) => event === 'Initialized').length).to.be.equal(2);
      expectEvent(receipt, 'Initialized', { version: '2' });
      expectEvent(receipt, 'Initialized', { version: '3' });
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

  describe('disabling initialization', function () {
    it('old and new patterns in bad sequence', async function () {
      await expectRevert(DisableBad1.new(), 'Initializable: contract is already initialized');
      await expectRevert(DisableBad2.new(), 'Initializable: contract is initializing');
    });

    it('old and new patterns in good sequence', async function () {
      const ok = await DisableOk.new();
      await expectEvent.inConstruction(ok, 'Initialized', { version: '1' });
      await expectEvent.inConstruction(ok, 'Initialized', { version: '255' });
    });
  });
});
