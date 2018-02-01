import ether from '../../helpers/ether'
import EVMRevert from '../../helpers/EVMRevert'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

var PseudoMinter = artifacts.require("./token/ERC20/PseudoMinter.sol");
var SimpleToken = artifacts.require("./example/SimpleToken.sol");


contract('PseudoMinter', function ([owner, tokenAddress]) {

  beforeEach(async function () {

    this.simpleToken = await SimpleToken.new()
    this.pseudoMinter = await PseudoMinter.new(this.simpleToken.address,owner)

    this.cap = await this.simpleToken.totalSupply();
    this.lessThanCap = 1;

    await this.simpleToken.approve(this.pseudoMinter.address, this.cap)
  })

  it('should accept minting within approved cap', async function () {
    await this.pseudoMinter.mint(tokenAddress, this.cap.minus(this.lessThanCap)).should.be.fulfilled
    await this.pseudoMinter.mint(tokenAddress, this.lessThanCap).should.be.fulfilled

    let amount = await this.simpleToken.balanceOf(tokenAddress)
    amount.should.be.bignumber.equal(this.cap)
  })

  it('should reject minting outside approved cap', async function () {
    await this.pseudoMinter.mint(tokenAddress, this.cap).should.be.fulfilled
    await this.pseudoMinter.mint(tokenAddress, 1).should.be.rejectedWith(EVMRevert)

    let amount = await this.simpleToken.balanceOf(tokenAddress)
    amount.should.be.bignumber.equal(this.cap)
  })

  it('should reject minting that exceed approved cap', async function () {
    await this.pseudoMinter.mint(tokenAddress, this.cap.plus(1)).should.be.rejectedWith(EVMRevert)

    let amount = await this.simpleToken.balanceOf(tokenAddress)
    amount.should.be.bignumber.equal(0)
  })

  it('should be able to change cap by calling tokens approve function', async function () {
    await this.simpleToken.approve(this.pseudoMinter.address, 0)

    let amount = await this.pseudoMinter.availableSupply.call()
    amount.should.be.bignumber.equal(0)

    await this.pseudoMinter.mint(tokenAddress, 1).should.be.rejectedWith(EVMRevert)
  })

})
