const { expectThrow } = require('../../helpers/expectThrow');
const expectEvent = require('../../helpers/expectEvent');

const RBACMock = artifacts.require('RBACMock');

require('chai')
  .should();

const ROLE_ADVISOR = 'advisor';

contract('RBAC', function ([_, admin, anyone, advisor, otherAdvisor, futureAdvisor]) {
  let mock;

  beforeEach(async () => {
    mock = await RBACMock.new([advisor, otherAdvisor], { from: admin });
  });

  context('in normal conditions', () => {
    it('allows admin to call #onlyAdminsCanDoThis', async () => {
      await mock.onlyAdminsCanDoThis({ from: admin });
    });
    it('allows admin to call #onlyAdvisorsCanDoThis', async () => {
      await mock.onlyAdvisorsCanDoThis({ from: admin });
    });
    it('allows advisors to call #onlyAdvisorsCanDoThis', async () => {
      await mock.onlyAdvisorsCanDoThis({ from: advisor });
    });
    it('allows admin to call #eitherAdminOrAdvisorCanDoThis', async () => {
      await mock.eitherAdminOrAdvisorCanDoThis({ from: admin });
    });
    it('allows advisors to call #eitherAdminOrAdvisorCanDoThis', async () => {
      await mock.eitherAdminOrAdvisorCanDoThis({ from: advisor });
    });
    it('does not allow admins to call #nobodyCanDoThis', async () => {
      await expectThrow(mock.nobodyCanDoThis({ from: admin }));
    });
    it('does not allow advisors to call #nobodyCanDoThis', async () => {
      await expectThrow(mock.nobodyCanDoThis({ from: advisor }));
    });
    it('does not allow anyone to call #nobodyCanDoThis', async () => {
      await expectThrow(mock.nobodyCanDoThis({ from: anyone }));
    });
    it('allows an admin to remove an advisor\'s role', async () => {
      await mock.removeAdvisor(advisor, { from: admin });
    });
    it('allows admins to #adminRemoveRole', async () => {
      await mock.adminRemoveRole(advisor, ROLE_ADVISOR, { from: admin });
    });

    it('announces a RoleAdded event on addRole', async () => {
      await expectEvent.inTransaction(
        mock.adminAddRole(futureAdvisor, ROLE_ADVISOR, { from: admin }),
        'RoleAdded'
      );
    });

    it('announces a RoleRemoved event on removeRole', async () => {
      await expectEvent.inTransaction(
        mock.adminRemoveRole(futureAdvisor, ROLE_ADVISOR, { from: admin }),
        'RoleRemoved'
      );
    });
  });

  context('in adversarial conditions', () => {
    it('does not allow an advisor to remove another advisor', async () => {
      await expectThrow(mock.removeAdvisor(otherAdvisor, { from: advisor }));
    });
    it('does not allow "anyone" to remove an advisor', async () => {
      await expectThrow(mock.removeAdvisor(advisor, { from: anyone }));
    });
  });
});
