const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const BatchCallTokenMock = artifacts.require('BatchCallTokenMock');

contract('BatchCallToken', function (accounts) {
  const [deployer, alice, bob] = accounts;
  const amount = 12000;

  beforeEach(async function () {
    this.batchCallToken = await BatchCallTokenMock.new(new BN(amount), { from: deployer });
  });

  it('batches function calls', async function () {
    expect(await this.batchCallToken.balanceOf(alice)).to.be.bignumber.equal(new BN('0'));
    expect(await this.batchCallToken.balanceOf(bob)).to.be.bignumber.equal(new BN('0'));

    await this.batchCallToken.batchCall([
      this.batchCallToken.contract.methods.transfer(alice, amount / 2).encodeABI(),
      this.batchCallToken.contract.methods.transfer(bob, amount / 3).encodeABI(),
    ], { from: deployer });

    expect(await this.batchCallToken.balanceOf(alice)).to.be.bignumber.equal(new BN(amount / 2));
    expect(await this.batchCallToken.balanceOf(bob)).to.be.bignumber.equal(new BN(amount / 3));
  });

  it('bubbles up revert reasons', async function () {
    const call = this.batchCallToken.batchCall([
      this.batchCallToken.contract.methods.transfer(alice, amount).encodeABI(),
      this.batchCallToken.contract.methods.transfer(bob, amount).encodeABI(),
    ], { from: deployer });

    await expectRevert(call, 'ERC20: transfer amount exceeds balance');
  });
});
