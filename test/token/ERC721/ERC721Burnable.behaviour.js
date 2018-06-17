import assertRevert from '../../helpers/assertRevert';
import expectEvent from '../../helpers/expectEvent';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

export default function shouldBurnLikeERC721Token ([minter, beneficiary, anotherAccount]) {
  const firstTokenId = 1;
  const unknownTokenId = 3;
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('like a burnable ERC721Token', function () {
    beforeEach(async function () {
      await this.token.mint(beneficiary, firstTokenId, { from: minter });
    });

    describe('burn', function () {
      const tokenId = firstTokenId;
      const sender = beneficiary;
      let logs = null;

      describe('when successful', function () {
        beforeEach(async function () {
          const result = await this.token.burnFrom(sender, tokenId, { from: sender });
          logs = result.logs;
        });

        it('burns the given token ID and adjusts the balance of the owner', async function () {
          await assertRevert(this.token.ownerOf(tokenId));
          const balance = await this.token.balanceOf(sender);
          balance.should.be.bignumber.equal(0);
        });

        it('emits a transfer event', async function () {
          logs.length.should.be.equal(1);
          await expectEvent.inLogs(logs, 'Transfer', {
            _from: sender,
            _to: ZERO_ADDRESS,
            _tokenId: tokenId,
          });
        });
      });

      describe('when there is a previous approval', function () {
        beforeEach(async function () {
          await this.token.approve(anotherAccount, tokenId, { from: sender });
          const result = await this.token.burnFrom(sender, tokenId, { from: sender });
          logs = result.logs;
        });

        it('clears the approval', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });

        it('emits a transfer event', async function () {
          logs.length.should.be.equal(1);
          await expectEvent.inLogs(logs, 'Transfer', {
            _from: sender,
            _to: ZERO_ADDRESS,
            _tokenId: tokenId,
          });
        });
      });

      describe('when the given token ID was not tracked by this contract', function () {
        it('reverts', async function () {
          await assertRevert(this.token.burnFrom(sender, unknownTokenId, { from: sender }));
        });
      });
    });
  });
};
