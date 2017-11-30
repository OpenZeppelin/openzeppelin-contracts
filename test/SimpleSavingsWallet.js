'use strict'

const SimpleSavingsWallet = artifacts.require('../contracts/examples/SimpleSavingsWallet.sol')

contract('SimpleSavingsWallet', function(accounts) {
  let savingsWallet
  let owner

  beforeEach(async function() {
    savingsWallet = await SimpleSavingsWallet.new(4141)
    owner = await inheritable.owner()
  })

	it('should receive funds', async function() {
		await web3.eth.sendTransaction({from: owner, to: this.contract.address, value: amount})
  })
