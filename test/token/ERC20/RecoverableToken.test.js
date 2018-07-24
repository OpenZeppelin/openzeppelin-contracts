const StandardTokenMock = artifacts.require('StandardTokenMock');
const RecoverableTokenMock = artifacts.require('RecoverableTokenMock');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract.only('RecoverableToken', function ([creator, owner, recipient, anotherAccount]) {
  beforeEach(async function () {
    this.token = await StandardTokenMock.new(owner, 100);
    this.otherToken = await RecoverableTokenMock.new(anotherAccount, 100);
  });

  describe('Recover token', function () {
    it('transfer token from contract to owner', async function () {
      const amount = 10;
      const ownerStartBalance = await this.token.balanceOf(owner);
      await this.token.transfer(this.otherToken.address, amount, {
        from: owner,
      });

      const ownerDecreaseBalance = await this.token.balanceOf(owner);
      const contractIncreaseBalance = await this.token.balanceOf(this.otherToken.address);
      ownerDecreaseBalance.should.be.bignumber.eq(ownerStartBalance.sub(amount));
      contractIncreaseBalance.should.be.bignumber.equal(amount);

      await this.otherToken.recoverToken(this.token.address, {
        from: creator,
      });

      const contractDecreaseBalance = await this.token.balanceOf(this.otherToken.address);
      const creatorIncreaseBalance = await this.token.balanceOf(creator);
      creatorIncreaseBalance.should.be.bignumber.eq(amount);
      contractDecreaseBalance.should.be.bignumber.equal(0);
    });
  });
});
