const ERC165CheckerMock = artifacts.require('ERC165CheckerMock');
const ERC165NotSupported = artifacts.require('ERC165NotSupported');
const ERC165InterfacesSupported = artifacts.require('ERC165InterfacesSupported');

const DUMMY_ID = '0xdeadbeef';
const DUMMY_ID_2 = '0xcafebabe';
const DUMMY_ID_3 = '0xdecafbad';
const DUMMY_UNSUPPORTED_ID = '0xbaddcafe';
const DUMMY_UNSUPPORTED_ID_2 = '0xbaadcafe';
const DUMMY_ACCOUNT = '0x1111111111111111111111111111111111111111';

require('chai')
  .should();

contract('ERC165Checker', function () {
  beforeEach(async function () {
    this.mock = await ERC165CheckerMock.new();
  });

  context('ERC165 not supported', function () {
    beforeEach(async function () {
      this.target = await ERC165NotSupported.new();
    });

    it('does not support ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);
      supported.should.equal(false);
    });

    it('does not support mock interface via supportsInterface', async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);
      supported.should.equal(false);
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      const supported = await this.mock.supportsAllInterfaces(this.target.address, [DUMMY_ID]);
      supported.should.equal(false);
    });
  });

  context('ERC165 supported', function () {
    beforeEach(async function () {
      this.target = await ERC165InterfacesSupported.new([]);
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);
      supported.should.equal(true);
    });

    it('does not support mock interface via supportsInterface', async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);
      supported.should.equal(false);
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      const supported = await this.mock.supportsAllInterfaces(this.target.address, [DUMMY_ID]);
      supported.should.equal(false);
    });
  });

  context('ERC165 and single interface supported', function () {
    beforeEach(async function () {
      this.target = await ERC165InterfacesSupported.new([DUMMY_ID]);
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);
      supported.should.equal(true);
    });

    it('supports mock interface via supportsInterface', async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);
      supported.should.equal(true);
    });

    it('supports mock interface via supportsAllInterfaces', async function () {
      const supported = await this.mock.supportsAllInterfaces(this.target.address, [DUMMY_ID]);
      supported.should.equal(true);
    });
  });

  context('ERC165 and many interfaces supported', function () {
    beforeEach(async function () {
      this.supportedInterfaces = [DUMMY_ID, DUMMY_ID_2, DUMMY_ID_3];
      this.target = await ERC165InterfacesSupported.new(this.supportedInterfaces);
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);
      supported.should.equal(true);
    });

    it('supports each interfaceId via supportsInterface', async function () {
      for (const interfaceId of this.supportedInterfaces) {
        const supported = await this.mock.supportsInterface(this.target.address, interfaceId);
        supported.should.equal(true);
      };
    });

    it('supports all interfaceIds via supportsAllInterfaces', async function () {
      const supported = await this.mock.supportsAllInterfaces(this.target.address, this.supportedInterfaces);
      supported.should.equal(true);
    });

    it('supports none of the interfaces queried via supportsAllInterfaces', async function () {
      const interfaceIdsToTest = [DUMMY_UNSUPPORTED_ID, DUMMY_UNSUPPORTED_ID_2];

      const supported = await this.mock.supportsAllInterfaces(this.target.address, interfaceIdsToTest);
      supported.should.equal(false);
    });

    it('supports not all of the interfaces queried via supportsAllInterfaces', async function () {
      const interfaceIdsToTest = [...this.supportedInterfaces, DUMMY_UNSUPPORTED_ID];

      const supported = await this.mock.supportsAllInterfaces(this.target.address, interfaceIdsToTest);
      supported.should.equal(false);
    });
  });

  context('account address does not support ERC165', function () {
    it('does not support ERC165', async function () {
      const supported = await this.mock.supportsERC165(DUMMY_ACCOUNT);
      supported.should.equal(false);
    });

    it('does not support mock interface via supportsInterface', async function () {
      const supported = await this.mock.supportsInterface(DUMMY_ACCOUNT, DUMMY_ID);
      supported.should.equal(false);
    });

    it('does not support mock interface via supportsAllInterfaces', async function () {
      const supported = await this.mock.supportsAllInterfaces(DUMMY_ACCOUNT, [DUMMY_ID]);
      supported.should.equal(false);
    });
  });
});
