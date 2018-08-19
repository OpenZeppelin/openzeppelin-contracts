const ERC165Checker = artifacts.require('ERC165CheckerMock');
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
      actual.should.equal(expected);
    }
  };

  before(async function () {
    this.mock = await ERC165Checker.new();
  });

  context('ERC165 not supported', () => {
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

    it(`does not support [${DUMMY_ID}] via supportsInterfaces`, async function () {
      const supported = await this.mock.supportsInterfaces(this.target.address, [DUMMY_ID]);

      assertIgnoringCoverage(supported, false);
    });
  });

  context('ERC165 supported', () => {
    beforeEach(async function () {
      this.target = await ERC165InterfacesSupported.new([]);
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);

      assertIgnoringCoverage(supported, true);
    });

    it(`does not support ${DUMMY_ID} via supportsInterface`, async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);

      assertIgnoringCoverage(supported, false);
    });

    it(`does not support [${DUMMY_ID}] via supportsInterfaces`, async function () {
      const supported = await this.mock.supportsInterfaces(this.target.address, [DUMMY_ID]);

      assertIgnoringCoverage(supported, false);
    });
  });

  context('ERC165 and single interface supported', () => {
    beforeEach(async function () {
      this.target = await ERC165InterfacesSupported.new([DUMMY_ID]);
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);

      assertIgnoringCoverage(supported, true);
    });

    it(`supports ${DUMMY_ID} via supportsInterface`, async function () {
      const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);

      assertIgnoringCoverage(supported, true);
    });

    it(`supports [${DUMMY_ID}] via supportsInterfaces`, async function () {
      const supported = await this.mock.supportsInterfaces(this.target.address, [DUMMY_ID]);

      assertIgnoringCoverage(supported, true);
    });
  });

  context('ERC165 and many interfaces supported', () => {
    beforeEach(async function () {
      this.supportedInterfaces = [DUMMY_ID, DUMMY_ID_2, DUMMY_ID_3];
      this.target = await ERC165InterfacesSupported.new(this.supportedInterfaces);
    });

    it('supports ERC165', async function () {
      const supported = await this.mock.supportsERC165(this.target.address);

      assertIgnoringCoverage(supported, true);
    });

    it('supports each interfaceId via supportsInterface', async function () {
      this.supportedInterfaces.forEach(async interfaceId => {
        const supported = await this.mock.supportsInterface(this.target.address, DUMMY_ID);

        assertIgnoringCoverage(supported, true);
      });
    });

    it('supports all interfaceIds via supportsInterfaces', async function () {
      const supported = await this.mock.supportsInterfaces(this.target.address, this.supportedInterfaces);

      assertIgnoringCoverage(supported, true);
    });

    it('supports none of the interfaces queried via supportsInterfaces', async function () {
      const interfaceIdsToTest = [DUMMY_UNSUPPORTED_ID, DUMMY_UNSUPPORTED_ID_2];
      const supported = await this.mock.supportsInterfaces(this.target.address, interfaceIdsToTest);

      assertIgnoringCoverage(supported, false);
    });

    it('supports not all of the interfaces queried via supportsInterfaces', async function () {
      const interfaceIdsToTest = [...this.supportedInterfaces, DUMMY_UNSUPPORTED_ID];
      const supported = await this.mock.supportsInterfaces(this.target.address, interfaceIdsToTest);

      assertIgnoringCoverage(supported, false);
    });
  });

  context('account address does not support erc165', () => {
    it('does not support ERC165', async function () {
      const supported = await this.mock.supportsERC165(DUMMY_ACCOUNT);

      assertIgnoringCoverage(supported, false);
    });

    it(`does not support ${DUMMY_ID} via supportsInterface`, async function () {
      const supported = await this.mock.supportsInterface(DUMMY_ACCOUNT, DUMMY_ID);

      assertIgnoringCoverage(supported, false);
    });

    it(`does not support [${DUMMY_ID}] via supportsInterfaces`, async function () {
      const supported = await this.mock.supportsInterfaces(DUMMY_ACCOUNT, [DUMMY_ID]);

      assertIgnoringCoverage(supported, false);
    });
  });
});
