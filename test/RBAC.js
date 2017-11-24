const RBACMock = artifacts.require('./helpers/RBACMock.sol')

import expectThrow from './helpers/expectThrow'

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('RBAC', function(accounts) {
  let mock

  const [
    owner,
    anyone,
    ...advisors
  ] = accounts

  before(async () => {
    mock = await RBACMock.new(advisors, { from: owner })
  })

  context('in normal conditions', () => {
    it('allows owner to call #onlyOwnersCanDoThis', async () => {
      await mock.onlyOwnersCanDoThis({ from: owner })
        .should.be.fulfilled
    })
    it('allows owner to call #onlyAdvisorsCanDoThis', async () => {
      await mock.onlyAdvisorsCanDoThis({ from: owner })
        .should.be.fulfilled
    })
    it('allows advisors to call #onlyAdvisorsCanDoThis', async () => {
      await mock.onlyAdvisorsCanDoThis({ from: advisors[0] })
        .should.be.fulfilled
    })
    it('allows owner to call #eitherOwnerOrAdvisorCanDoThis', async () => {
      await mock.eitherOwnerOrAdvisorCanDoThis({ from: owner })
        .should.be.fulfilled
    })
    it('allows advisors to call #eitherOwnerOrAdvisorCanDoThis', async () => {
      await mock.eitherOwnerOrAdvisorCanDoThis({ from: advisors[0] })
        .should.be.fulfilled
    })
    it('does not allow owners to call #nobodyCanDoThis', async () => {
      expectThrow(
        mock.nobodyCanDoThis({ from: owner })
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
    it('allows an owner to remove an advisor\'s role', async () => {
      await mock.removeAdvisor(advisors[0], { from: owner })
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
