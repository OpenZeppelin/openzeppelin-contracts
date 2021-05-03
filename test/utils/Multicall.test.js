const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const MulticallTokenMock = artifacts.require('MulticallTokenMock');

contract('MulticallToken', function (accounts) {
  const [deployer, alice, bob] = accounts;
  const amount = 12000;

  beforeEach(async function () {
    this.multicallToken = await MulticallTokenMock.new(new BN(amount), { from: deployer });
  });

  it('batches function calls', async function () {
    expect(await this.multicallToken.balanceOf(alice)).to.be.bignumber.equal(new BN('0'));
    expect(await this.multicallToken.balanceOf(bob)).to.be.bignumber.equal(new BN('0'));

    await this.multicallToken.multicall([
      this.multicallToken.contract.methods.transfer(alice, amount / 2).encodeABI(),
      this.multicallToken.contract.methods.transfer(bob, amount / 3).encodeABI(),
    ], { from: deployer });

    expect(await this.multicallToken.balanceOf(alice)).to.be.bignumber.equal(new BN(amount / 2));
    expect(await this.multicallToken.balanceOf(bob)).to.be.bignumber.equal(new BN(amount / 3));
  });

  it('returns an array with the result of each call', async function () {
    const MulticallTest = artifacts.require('MulticallTest');
    const multicallTest = await MulticallTest.new({ from: deployer });
    await this.multicallToken.transfer(multicallTest.address, amount, { from: deployer });
    expect(await this.multicallToken.balanceOf(multicallTest.address)).to.be.bignumber.equal(new BN(amount));

    const recipients = [alice, bob];
    const amounts = [amount / 2, amount / 3].map(n => new BN(n));

    await multicallTest.testReturnValues(this.multicallToken.address, recipients, amounts);
  });

  it('reverts previous calls', async function () {
    expect(await this.multicallToken.balanceOf(alice)).to.be.bignumber.equal(new BN('0'));

    const call = this.multicallToken.multicall([
      this.multicallToken.contract.methods.transfer(alice, amount).encodeABI(),
      this.multicallToken.contract.methods.transfer(bob, amount).encodeABI(),
    ], { from: deployer });

    await expectRevert(call, 'ERC20: transfer amount exceeds balance');
    expect(await this.multicallToken.balanceOf(alice)).to.be.bignumber.equal(new BN('0'));
  });

  it('bubbles up revert reasons', async function () {
    const call = this.multicallToken.multicall([
      this.multicallToken.contract.methods.transfer(alice, amount).encodeABI(),
      this.multicallToken.contract.methods.transfer(bob, amount).encodeABI(),
    ], { from: deployer });

    await expectRevert(call, 'ERC20: transfer amount exceeds balance');
  });
});
