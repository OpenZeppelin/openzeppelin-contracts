const { accounts, load } = require('@openzeppelin/test-env');
const [ capper, otherCapper, ...otherAccounts ] = accounts;

const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');
const CapperRoleMock = load.truffle('CapperRoleMock');

describe('CapperRole', function () {
  beforeEach(async function () {
    this.contract = await CapperRoleMock.new({ from: capper });
    await this.contract.addCapper(otherCapper, { from: capper });
  });

  shouldBehaveLikePublicRole(capper, otherCapper, otherAccounts, 'capper');
});
