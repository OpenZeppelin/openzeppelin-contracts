const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { MAX_UINT64 } = require('../../helpers/constants');

async function fixture() {
  const contract = await ethers.deployContract('InitializableMock');
  return { contract };
}

describe('Initializable', function () {
  describe('basic testing without inheritance', function () {
    beforeEach('deploying', async function () {
      Object.assign(this, await loadFixture(fixture));
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
        await expect(this.contract.initialize()).to.be.revertedWithCustomError(this.contract, 'InvalidInitialization');
      });
    });

    describe('nested under an initializer', function () {
      it('initializer modifier reverts', async function () {
        await expect(this.contract.initializerNested()).to.be.revertedWithCustomError(
          this.contract,
          'InvalidInitialization',
        );
      });

      it('onlyInitializing modifier succeeds', async function () {
        await this.contract.onlyInitializingNested();
        expect(await this.contract.onlyInitializingRan()).to.equal(true);
      });
    });

    it('cannot call onlyInitializable function outside the scope of an initializable function', async function () {
      await expect(this.contract.initializeOnlyInitializing()).to.be.revertedWithCustomError(
        this.contract,
        'NotInitializing',
      );
    });
  });

  it('nested initializer can run during construction', async function () {
    const contract2 = await ethers.deployContract('ConstructorInitializableMock');
    expect(await contract2.initializerRan()).to.equal(true);
    expect(await contract2.onlyInitializingRan()).to.equal(true);
  });

  it('multiple constructor levels can be initializers', async function () {
    const contract2 = await ethers.deployContract('ChildConstructorInitializableMock');
    expect(await contract2.initializerRan()).to.equal(true);
    expect(await contract2.childInitializerRan()).to.equal(true);
    expect(await contract2.onlyInitializingRan()).to.equal(true);
  });

  describe('reinitialization', function () {
    beforeEach('deploying', async function () {
      this.contract = await ethers.deployContract('ReinitializerMock');
    });

    it('can reinitialize', async function () {
      expect(await this.contract.counter()).to.be.equal(0n);
      await this.contract.initialize();
      expect(await this.contract.counter()).to.be.equal(1n);
      await this.contract.reinitialize(2);
      expect(await this.contract.counter()).to.be.equal(2n);
      await this.contract.reinitialize(3);
      expect(await this.contract.counter()).to.be.equal(3n);
    });

    it('can jump multiple steps', async function () {
      expect(await this.contract.counter()).to.be.equal(0n);
      await this.contract.initialize();
      expect(await this.contract.counter()).to.be.equal(1n);
      await this.contract.reinitialize(128);
      expect(await this.contract.counter()).to.be.equal(2n);
    });

    it('cannot nest reinitializers', async function () {
      expect(await this.contract.counter()).to.be.equal(0n);
      await expect(this.contract.nestedReinitialize(2, 2)).to.be.revertedWithCustomError(
        this.contract,
        'InvalidInitialization',
      );
      await expect(this.contract.nestedReinitialize(2, 3)).to.be.revertedWithCustomError(
        this.contract,
        'InvalidInitialization',
      );
      await expect(this.contract.nestedReinitialize(3, 2)).to.be.revertedWithCustomError(
        this.contract,
        'InvalidInitialization',
      );
    });

    it('can chain reinitializers', async function () {
      expect(await this.contract.counter()).to.be.equal(0n);
      await this.contract.chainReinitialize(2, 3);
      expect(await this.contract.counter()).to.be.equal(2n);
    });

    it('_getInitializedVersion returns right version', async function () {
      await this.contract.initialize();
      expect(await this.contract.getInitializedVersion()).to.be.equal(1n);
      await this.contract.reinitialize(12);
      expect(await this.contract.getInitializedVersion()).to.be.equal(12n);
    });

    describe('contract locking', function () {
      it('prevents initialization', async function () {
        await this.contract.disableInitializers();
        await expect(this.contract.initialize()).to.be.revertedWithCustomError(this.contract, 'InvalidInitialization');
      });

      it('prevents re-initialization', async function () {
        await this.contract.disableInitializers();
        await expect(this.contract.reinitialize(255n)).to.be.revertedWithCustomError(
          this.contract,
          'InvalidInitialization',
        );
      });

      it('can lock contract after initialization', async function () {
        await this.contract.initialize();
        await this.contract.disableInitializers();
        await expect(this.contract.reinitialize(255n)).to.be.revertedWithCustomError(
          this.contract,
          'InvalidInitialization',
        );
      });
    });
  });

  describe('events', function () {
    it('constructor initialization emits event', async function () {
      const contract = await ethers.deployContract('ConstructorInitializableMock');
      await expect(contract.deploymentTransaction()).to.emit(contract, 'Initialized').withArgs(1n);
    });

    it('initialization emits event', async function () {
      const contract = await ethers.deployContract('ReinitializerMock');

      const tx = await contract.initialize();
      await expect(tx).to.emit(contract, 'Initialized').withArgs(1n);
    });

    it('reinitialization emits event', async function () {
      const contract = await ethers.deployContract('ReinitializerMock');

      const tx = await contract.reinitialize(128);
      await expect(tx).to.emit(contract, 'Initialized').withArgs(128n);
    });

    it('chained reinitialization emits multiple events', async function () {
      const contract = await ethers.deployContract('ReinitializerMock');

      const tx = await contract.chainReinitialize(2, 3);
      await expect(tx).to.emit(contract, 'Initialized').withArgs(2n);
      await expect(tx).to.emit(contract, 'Initialized').withArgs(3n);
    });
  });

  describe('complex testing with inheritance', function () {
    const mother = 12n;
    const gramps = '56';
    const father = 34n;
    const child = 78n;

    beforeEach('deploying', async function () {
      this.contract = await ethers.deployContract('SampleChild');
      await this.contract.initialize(mother, gramps, father, child);
    });

    it('initializes human', async function () {
      expect(await this.contract.isHuman()).to.be.equal(true);
    });

    it('initializes mother', async function () {
      expect(await this.contract.mother()).to.be.equal(mother);
    });

    it('initializes gramps', async function () {
      expect(await this.contract.gramps()).to.be.equal(gramps);
    });

    it('initializes father', async function () {
      expect(await this.contract.father()).to.be.equal(father);
    });

    it('initializes child', async function () {
      expect(await this.contract.child()).to.be.equal(child);
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
      await expect(ok.deploymentTransaction()).to.emit(ok, 'Initialized').withArgs(1n);
      await expect(ok.deploymentTransaction()).to.emit(ok, 'Initialized').withArgs(MAX_UINT64);
    });
  });
});
