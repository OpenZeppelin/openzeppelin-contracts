const RBACMock = artifacts.require('./helpers/RBACMock.sol')

import expectThrow from './helpers/expectThrow'

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('RBAC', function(accounts) {
  let mock

  const [
    admin,
    anyone,
    ...advisors
  ] = accounts

  before(async () => {
    mock = await RBACMock.new(advisors, { from: admin })
  })

  context('in normal conditions', () => {
    it('allows admin to call #onlyAdminsCanDoThis', async () => {
      await mock.onlyAdminsCanDoThis({ from: admin })
        .should.be.fulfilled
    })
    it('allows admin to call #onlyAdvisorsCanDoThis', async () => {
      await mock.onlyAdvisorsCanDoThis({ from: admin })
        .should.be.fulfilled
    })
    it('allows advisors to call #onlyAdvisorsCanDoThis', async () => {
      await mock.onlyAdvisorsCanDoThis({ from: advisors[0] })
        .should.be.fulfilled
    })
    it('allows admin to call #eitherAdminOrAdvisorCanDoThis', async () => {
      await mock.eitherAdminOrAdvisorCanDoThis({ from: admin })
        .should.be.fulfilled
    })
    it('allows advisors to call #eitherAdminOrAdvisorCanDoThis', async () => {
      await mock.eitherAdminOrAdvisorCanDoThis({ from: advisors[0] })
        .should.be.fulfilled
    })
    it('does not allow admins to call #nobodyCanDoThis', async () => {
      expectThrow(
        mock.nobodyCanDoThis({ from: admin })
      )
    })
    it('does not allow advisors to call #nobodyCanDoThis', async () => {
      expectThrow(
        mock.nobodyCanDoThis({ from: advisors[0] })
      )
    })
    it('does not allow anyone to call #nobodyCanDoThis', async () => {
      expectThrow(
        mock.nobodyCanDoThis({ from: anyone })
      )
    })
    it('allows an admin to remove an advisor\'s role', async () => {
      await mock.removeAdvisor(advisors[0], { from: admin })
        .should.be.fulfilled
    })
    it('allows admins to #adminRemoveRole', async () => {
      await mock.adminRemoveRole(advisors[3], 'advisor', { from: admin })
        .should.be.fulfilled
    })
  })

  context('in adversarial conditions', () => {
    it('does not allow an advisor to remove another advisor', async () => {
      expectThrow(
        mock.removeAdvisor(advisors[1], { from: advisors[0] })
      )
    })
    it('does not allow "anyone" to remove an advisor', async () => {
      expectThrow(
        mock.removeAdvisor(advisors[0], { from: anyone })
      )
    })
  })

})
