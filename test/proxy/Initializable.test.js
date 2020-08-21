const { contract } = require('@openzeppelin/test-environment');

const { expectRevert } = require('@openzeppelin/test-helpers');

const { assert } = require('chai');

const InitializableMock = contract.fromArtifact('InitializableMock');
const SampleChild = contract.fromArtifact('SampleChild');

describe('Initializable', function () {
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

    context('after nested initialize', function () {
      beforeEach('initializing', async function () {
        await this.contract.initializeNested();
      });

      it('initializer has run', async function () {
        assert.isTrue(await this.contract.initializerRan());
      });
    });
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
