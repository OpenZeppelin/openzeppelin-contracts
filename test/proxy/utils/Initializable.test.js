const { expectRevert } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');

const InitializableMock = artifacts.require('InitializableMock');
const ConstructorInitializableMock = artifacts.require('ConstructorInitializableMock');
const SampleChild = artifacts.require('SampleChild');

contract('Initializable', function (accounts) {
  describe('basic testing without inheritance', function () {
    beforeEach('deploying', async function () {
      this.contract = await InitializableMock.new();
    });

    context('before initialize', function () {
      it('initializer has not run', async function () {
        assert.isFalse(await this.contract.initializerRan());
      });
    });

    context('after initialize', function () {
      beforeEach('initializing', async function () {
        await this.contract.initialize();
      });

      it('initializer has run', async function () {
        assert.isTrue(await this.contract.initializerRan());
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
        assert.isTrue(await this.contract.onlyInitializingRan());
      });
    });

    it('cannot call onlyInitializable function outside the scope of an initializable function', async function () {
      await expectRevert(this.contract.initializeOnlyInitializing(), 'Initializable: contract is not initializing');
    });
  });

  it('nested initializer can run during construction', async function () {
    const contract2 = await ConstructorInitializableMock.new();
    assert.isTrue(await contract2.initializerRan());
    assert.isTrue(await contract2.onlyInitializingRan());
  });

  describe('complex testing with inheritance', function () {
    const mother = 12;
    const gramps = '56';
    const father = 34;
    const child = 78;

    beforeEach('deploying', async function () {
      this.contract = await SampleChild.new();
    });

    beforeEach('initializing', async function () {
      await this.contract.initialize(mother, gramps, father, child);
    });

    it('initializes human', async function () {
      assert.equal(await this.contract.isHuman(), true);
    });

    it('initializes mother', async function () {
      assert.equal(await this.contract.mother(), mother);
    });

    it('initializes gramps', async function () {
      assert.equal(await this.contract.gramps(), gramps);
    });

    it('initializes father', async function () {
      assert.equal(await this.contract.father(), father);
    });

    it('initializes child', async function () {
      assert.equal(await this.contract.child(), child);
    });
  });
});
