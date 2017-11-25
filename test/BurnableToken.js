'use strict'

const EVMRevert = require('./helpers/EVMRevert.js')
const BurnableTokenMock = artifacts.require("./helpers/BurnableTokenMock.sol")
const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const expect = require('chai').expect

contract('BurnableToken', function (accounts) {
    let token
    let expectedTokenSupply = new BigNumber(999)

    beforeEach(async function () {
        token = await BurnableTokenMock.new(accounts[0], 1000)
    })

    it('owner should be able to burn tokens', async function () {
        const { logs } = await token.burn(1, { from: accounts[0] })

        const balance = await token.balanceOf(accounts[0])
        balance.should.be.bignumber.equal(expectedTokenSupply)

        const totalSupply = await token.totalSupply()
        totalSupply.should.be.bignumber.equal(expectedTokenSupply)

        const event = logs.find(e => e.event === 'Burn')
        expect(event).to.exist
    })

    it('cannot burn more tokens than your balance', async function () {
        await token.burn(2000, { from: accounts[0] })
        .should.be.rejectedWith(EVMRevert)
    })
})
