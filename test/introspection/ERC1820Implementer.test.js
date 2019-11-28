const { accounts, contract } = require('@openzeppelin/test-environment');

const { expectRevert, singletons } = require('@openzeppelin/test-helpers');
const { bufferToHex, keccak256 } = require('ethereumjs-util');

const { expect } = require('chai');

const ERC1820ImplementerMock = contract.fromArtifact('ERC1820ImplementerMock');

describe('ERC1820Implementer', function () {
  const [ registryFunder, implementee, other ] = accounts;

  const ERC1820_ACCEPT_MAGIC = bufferToHex(keccak256('ERC1820_ACCEPT_MAGIC'));

  beforeEach(async function () {
    this.implementer = await ERC1820ImplementerMock.new();
    this.registry = await singletons.ERC1820Registry(registryFunder);

    this.interfaceA = bufferToHex(keccak256('interfaceA'));
    this.interfaceB = bufferToHex(keccak256('interfaceB'));
  });

  context('with no registered interfaces', function () {
    it('returns false when interface implementation is queried', async function () {
      expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceA, implementee))
        .to.not.equal(ERC1820_ACCEPT_MAGIC);
    });

    it('reverts when attempting to set as implementer in the registry', async function () {
      await expectRevert(
        this.registry.setInterfaceImplementer(
          implementee, this.interfaceA, this.implementer.address, { from: implementee }
        ),
        'Does not implement the interface'
      );
    });
  });

  context('with registered interfaces', function () {
    beforeEach(async function () {
      await this.implementer.registerInterfaceForAddress(this.interfaceA, implementee);
    });

    it('returns true when interface implementation is queried', async function () {
      expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceA, implementee))
        .to.equal(ERC1820_ACCEPT_MAGIC);
    });

    it('returns false when interface implementation for non-supported interfaces is queried', async function () {
      expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceB, implementee))
        .to.not.equal(ERC1820_ACCEPT_MAGIC);
    });

    it('returns false when interface implementation for non-supported addresses is queried', async function () {
      expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceA, other))
        .to.not.equal(ERC1820_ACCEPT_MAGIC);
    });

    it('can be set as an implementer for supported interfaces in the registry', async function () {
      await this.registry.setInterfaceImplementer(
        implementee, this.interfaceA, this.implementer.address, { from: implementee }
      );

      expect(await this.registry.getInterfaceImplementer(implementee, this.interfaceA))
        .to.equal(this.implementer.address);
    });
  });
});
