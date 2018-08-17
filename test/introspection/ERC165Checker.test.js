const ERC165Checker = artifacts.require('ERC165CheckerMock');
const ERC165NotSupported = artifacts.require('ERC165NotSupported');
const ERC165GenerallySupported = artifacts.require('ERC165GenerallySupported');
const ERC165InterfaceSupported = artifacts.require('ERC165InterfaceSupported');

const DUMMY_ID = '0xdeadbeef';
const DUMMY_ACCOUNT = '0x1111111111111111111111111111111111111111';

require('chai')
  .should();

contract('ERC165Checker', function (accounts) {
  /**
   * Helper function to ignore chai asserts in the case that the test is being run
   * with coverage analysis enabled. solidity-coverage creates EVM events and
   * those use the 0x40 free memory pointer (FMP), which conflicts with the implementation
   * of ERC165Checker which uses inline assembly and also uses the FMP.
   *
   * See https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1086#issuecomment-411944571
   *  or https://github.com/sc-forks/solidity-coverage/pull/52 for details.
   */
  const assertIgnoringCoverage = function (actual, expected) {
    if (!process.env.SOLIDITY_COVERAGE) {
      actual.should.eq(expected);
    }
  };

  before(async function () {
    this.mock = await ERC165Checker.new();
  });

  context('not supported', () => {
    beforeEach(async function () {
      this.target = await ERC165NotSupported.new();
    });

    it('does not support ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);

      assertIgnoringCoverage(supported, false);
    });

    it(`does not support ${DUMMY_ID} via supportsInterface`, async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);

      assertIgnoringCoverage(supported, false);
    });
  });

  context('generally supported', () => {
    beforeEach(async function () {
      this.target = await ERC165GenerallySupported.new();
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);

      assertIgnoringCoverage(supported, true);
    });

    it(`does not support ${DUMMY_ID} via supportsERC165Interface`, async function () {
      const supported = await this.mock.supportsERC165Interface(this.target.address, DUMMY_ID);

      assertIgnoringCoverage(supported, false);
    });

    it(`does not support ${DUMMY_ID} via supportsInterface`, async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);

      assertIgnoringCoverage(supported, false);
    });
  });

  context('interface supported', () => {
    beforeEach(async function () {
      this.target = await ERC165InterfaceSupported.new(DUMMY_ID);
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);

      assertIgnoringCoverage(supported, true);
    });

    it(`supports ${DUMMY_ID} via supportsERC165Interface`, async function () {
      const supported = await this.mock.supportsERC165Interface(this.target.address, DUMMY_ID);

      assertIgnoringCoverage(supported, true);
    });

    it(`supports ${DUMMY_ID} via supportsInterface`, async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);

      assertIgnoringCoverage(supported, true);
    });
  });

  context('account address does not support erc165', () => {
    it('does not support ERC165', async function () {
      const supported = await this.mock.supportsERC165(DUMMY_ACCOUNT);

      assertIgnoringCoverage(supported, false);
    });

    it(`does not support ${DUMMY_ID} via supportsERC165Interface`, async function () {
      const supported = await this.mock.supportsERC165Interface(DUMMY_ACCOUNT, DUMMY_ID);

      assertIgnoringCoverage(supported, false);
    });

    it(`does not support ${DUMMY_ID} via supportsInterface`, async function () {
      const supported = await this.mock.supportsInterface(DUMMY_ACCOUNT, DUMMY_ID);

      assertIgnoringCoverage(supported, false);
    });
  });
});
