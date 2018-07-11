import assertRevert from '../helpers/assertRevert';

const ERC165Checker = artifacts.require('ERC165CheckerMock');
const ERC165NotSupported = artifacts.require('ERC165NotSupported');
const ERC165GenerallySupported = artifacts.require('ERC165GenerallySupported');
const ERC165InterfaceSupported = artifacts.require('ERC165InterfaceSupported');

const DUMMY_ID = '0xdeadbeef';

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('ERC165Checker', function (accounts) {
  before(async function () {
    this.mock = await ERC165Checker.new();
  });

  context('not supported', () => {
    beforeEach(async function () {
      this.target = await ERC165NotSupported.new();
    });

    it('fails', async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);
      supported.should.eq(false);
    });
  });

  context('generally supported', () => {
    beforeEach(async function () {
      this.target = await ERC165GenerallySupported.new();
    });

    it('fails', async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);
      supported.should.eq(false);
    });
  });

  context('interface supported', () => {
    beforeEach(async function () {
      this.target = await ERC165InterfaceSupported.new(DUMMY_ID);
    });

    it('succeeds', async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);
      supported.should.eq(true);
    });
  });
});
