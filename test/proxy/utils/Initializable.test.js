const { ethers } = require('hardhat');
const { expect } = require('chai');
const { MAX_UINT64 } = require('../../helpers/constants');

describe('Initializable', function () {
  describe('basic testing without inheritance', function () {
    beforeEach('deploying', async function () {
      this.mock = await ethers.deployContract('InitializableMock');
    });

    describe('before initialize', function () {
      it('initializer has not run', async function () {
        expect(await this.mock.initializerRan()).to.be.false;
      });

      it('_initializing returns false before initialization', async function () {
        expect(await this.mock.isInitializing()).to.be.false;
      });
    });

    describe('after initialize', function () {
      beforeEach('initializing', async function () {
        await this.mock.initialize();
      });

      it('initializer has run', async function () {
        expect(await this.mock.initializerRan()).to.be.true;
      });

      it('_initializing returns false after initialization', async function () {
        expect(await this.mock.isInitializing()).to.be.false;
      });

      it('initializer does not run again', async function () {
        await expect(this.mock.initialize()).to.be.revertedWithCustomError(this.mock, 'InvalidInitialization');
      });
    });

    describe('nested under an initializer', function () {
      it('initializer modifier reverts', async function () {
        await expect(this.mock.initializerNested()).to.be.revertedWithCustomError(this.mock, 'InvalidInitialization');
      });

      it('onlyInitializing modifier succeeds', async function () {
        await this.mock.onlyInitializingNested();
        expect(await this.mock.onlyInitializingRan()).to.be.true;
      });
    });

    it('cannot call onlyInitializable function outside the scope of an initializable function', async function () {
      await expect(this.mock.initializeOnlyInitializing()).to.be.revertedWithCustomError(this.mock, 'NotInitializing');
    });
  });

  it('nested initializer can run during construction', async function () {
    const mock = await ethers.deployContract('ConstructorInitializableMock');
    expect(await mock.initializerRan()).to.be.true;
    expect(await mock.onlyInitializingRan()).to.be.true;
  });

  it('multiple constructor levels can be initializers', async function () {
    const mock = await ethers.deployContract('ChildConstructorInitializableMock');
    expect(await mock.initializerRan()).to.be.true;
    expect(await mock.childInitializerRan()).to.be.true;
    expect(await mock.onlyInitializingRan()).to.be.true;
  });

  describe('reinitialization', function () {
    beforeEach('deploying', async function () {
      this.mock = await ethers.deployContract('ReinitializerMock');
    });

    it('can reinitialize', async function () {
      expect(await this.mock.counter()).to.equal(0n);
      await this.mock.initialize();
      expect(await this.mock.counter()).to.equal(1n);
      await this.mock.reinitialize(2);
      expect(await this.mock.counter()).to.equal(2n);
      await this.mock.reinitialize(3);
      expect(await this.mock.counter()).to.equal(3n);
    });

    it('can jump multiple steps', async function () {
      expect(await this.mock.counter()).to.equal(0n);
      await this.mock.initialize();
      expect(await this.mock.counter()).to.equal(1n);
      await this.mock.reinitialize(128);
      expect(await this.mock.counter()).to.equal(2n);
    });

    it('cannot nest reinitializers', async function () {
      expect(await this.mock.counter()).to.equal(0n);
      await expect(this.mock.nestedReinitialize(2, 2)).to.be.revertedWithCustomError(
        this.mock,
        'InvalidInitialization',
      );
      await expect(this.mock.nestedReinitialize(2, 3)).to.be.revertedWithCustomError(
        this.mock,
        'InvalidInitialization',
      );
      await expect(this.mock.nestedReinitialize(3, 2)).to.be.revertedWithCustomError(
        this.mock,
        'InvalidInitialization',
      );
    });

    it('can chain reinitializers', async function () {
      expect(await this.mock.counter()).to.equal(0n);
      await this.mock.chainReinitialize(2, 3);
      expect(await this.mock.counter()).to.equal(2n);
    });

    it('_getInitializedVersion returns right version', async function () {
      await this.mock.initialize();
      expect(await this.mock.getInitializedVersion()).to.equal(1n);
      await this.mock.reinitialize(12);
      expect(await this.mock.getInitializedVersion()).to.equal(12n);
    });

    describe('contract locking', function () {
      it('prevents initialization', async function () {
        await this.mock.disableInitializers();
        await expect(this.mock.initialize()).to.be.revertedWithCustomError(this.mock, 'InvalidInitialization');
      });

      it('prevents re-initialization', async function () {
        await this.mock.disableInitializers();
        await expect(this.mock.reinitialize(255n)).to.be.revertedWithCustomError(this.mock, 'InvalidInitialization');
      });

      it('can lock contract after initialization', async function () {
        await this.mock.initialize();
        await this.mock.disableInitializers();
        await expect(this.mock.reinitialize(255n)).to.be.revertedWithCustomError(this.mock, 'InvalidInitialization');
      });
    });
  });

  describe('events', function () {
    it('constructor initialization emits event', async function () {
      const mock = await ethers.deployContract('ConstructorInitializableMock');
      await expect(mock.deploymentTransaction()).to.emit(mock, 'Initialized').withArgs(1n);
    });

    it('initialization emits event', async function () {
      const mock = await ethers.deployContract('ReinitializerMock');
      await expect(mock.initialize()).to.emit(mock, 'Initialized').withArgs(1n);
    });

    it('reinitialization emits event', async function () {
      const mock = await ethers.deployContract('ReinitializerMock');
      await expect(mock.reinitialize(128)).to.emit(mock, 'Initialized').withArgs(128n);
    });

    it('chained reinitialization emits multiple events', async function () {
      const mock = await ethers.deployContract('ReinitializerMock');

      await expect(mock.chainReinitialize(2, 3))
        .to.emit(mock, 'Initialized')
        .withArgs(2n)
        .to.emit(mock, 'Initialized')
        .withArgs(3n);
    });
  });

  describe('complex testing with inheritance', function () {
    const mother = 12n;
    const gramps = '56';
    const father = 34n;
    const child = 78n;

    beforeEach('deploying', async function () {
      this.mock = await ethers.deployContract('SampleChild');
      await this.mock.initialize(mother, gramps, father, child);
    });

    it('initializes human', async function () {
      expect(await this.mock.isHuman()).to.be.true;
    });

    it('initializes mother', async function () {
      expect(await this.mock.mother()).to.equal(mother);
    });

    it('initializes gramps', async function () {
      expect(await this.mock.gramps()).to.equal(gramps);
    });

    it('initializes father', async function () {
      expect(await this.mock.father()).to.equal(father);
    });

    it('initializes child', async function () {
      expect(await this.mock.child()).to.equal(child);
    });
  });

  describe('disabling initialization', function () {
    it('old and new patterns in bad sequence', async function () {
      const DisableBad1 = await ethers.getContractFactory('DisableBad1');
      await expect(DisableBad1.deploy()).to.be.revertedWithCustomError(DisableBad1, 'InvalidInitialization');

      const DisableBad2 = await ethers.getContractFactory('DisableBad2');
      await expect(DisableBad2.deploy()).to.be.revertedWithCustomError(DisableBad2, 'InvalidInitialization');
    });

    it('old and new patterns in good sequence', async function () {
      const ok = await ethers.deployContract('DisableOk');
      await expect(ok.deploymentTransaction())
        .to.emit(ok, 'Initialized')
        .withArgs(1n)
        .to.emit(ok, 'Initialized')
        .withArgs(MAX_UINT64);
    });
  });
});
