const { shouldFail, singletons } = require('openzeppelin-test-helpers');
const { bufferToHex, keccak256 } = require('ethereumjs-util');

const ERC1820ImplementerMock = artifacts.require('ERC1820ImplementerMock');

contract('ERC1820Implementer', function ([_, registryFunder, implementee, anyone]) {
  beforeEach(async function () {
    this.implementer = await ERC1820ImplementerMock.new();
    this.registry = await singletons.ERC1820Registry(registryFunder);

    this.interfaceA = bufferToHex(keccak256('interfaceA'));
    this.interfaceB = bufferToHex(keccak256('interfaceB'));
  });

  context('with no registered interfaces', function () {
    it('returns false when interface implementation is queried', async function () {
      (await this.implementer.implementsInterfaceForAddress(this.interfaceA, implementee)).should.equal(false);
    });

    it('reverts when attempting to set as implementer in the registry', async function () {
      await shouldFail.reverting(
        this.registry.setInterfaceImplementer(
          implementee, this.interfaceA, this.implementer.address, { from: implementee }
        )
      );
    });
  });

  context('with registered interfaces', function () {
    beforeEach(async function () {
      await this.implementer.registerInterfaceForAddress(this.interfaceA, implementee);
    });

    it('returns true when interface implementation is queried', async function () {
      (await this.implementer.implementsInterfaceForAddress(this.interfaceA, implementee)).should.equal(true);
    });

    it('returns false when interface implementation for non-supported interfaces is queried', async function () {
      (await this.implementer.implementsInterfaceForAddress(this.interfaceB, implementee)).should.equal(false);
    });

    it('returns false when interface implementation for non-supported addresses is queried', async function () {
      (await this.implementer.implementsInterfaceForAddress(this.interfaceA, anyone)).should.equal(false);
    });

    it('can be set as an implementer for supported interfaces in the registry', async function () {
      await this.registry.setInterfaceImplementer(
        implementee, this.interfaceA, this.implementer.address, { from: implementee }
      );

      (await this.registry.getInterfaceImplementer(implementee, this.interfaceA))
        .should.equal(this.implementer.address);
    });
  });
});
