import assertRevert from '../../helpers/assertRevert';
import { soliditySha3 } from 'web3-utils';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function ([owner, anotherAccount, minter]) {
  describe('as an Airdopable token', function () {
    describe('mint', function () {
      const amount = 100;

      describe('when the sender has a valid signature', function () {
        const from = minter;

        describe('when the token minting is not finished', function () {
          it('mints the requested amount to the agreed upon address with a signed proof from any address',
            async function () {
              const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
              await this.token.claim(anotherAccount, amount, 0, signature, { from });

              const balance = await this.token.balanceOf(anotherAccount);
              assert.equal(amount, balance);
            });

          it('mints the requested amount from the same signed proof should fail', async function () {
            const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
            await this.token.claim(anotherAccount, amount, 0, signature, { anotherAccount });
            await assertRevert(this.token.claim(anotherAccount, amount, 0, signature, { anotherAccount }));
            await assertRevert(this.token.claim(anotherAccount, amount, 0, signature, { owner }));
            await assertRevert(this.token.claim(anotherAccount, amount, 0, signature, { minter }));
          });

          it('mints the requested amount twice from the different signed proof', async function () {
            const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
            const signature2 = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 1));

            await this.token.claim(anotherAccount, amount, 0, signature, { anotherAccount });
            await this.token.claim(anotherAccount, amount, 1, signature2, { anotherAccount });
            
            const balance = await this.token.balanceOf(anotherAccount);
            assert.equal(amount + amount, balance);
          });

          it('mints with different parameters than the signed proof should fail', async function () {
            const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
            await assertRevert(this.token.claim(anotherAccount, amount + 1, 0, signature,
              { anotherAccount }));
            await assertRevert(this.token.claim(anotherAccount, amount, 1, signature, { anotherAccount }));
            await assertRevert(this.token.claim(owner, amount, 0, signature, { anotherAccount }));
          });
        });

        describe('when the token minting is finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            const signature = web3.eth.sign(from, soliditySha3(this.token.address, owner, amount, 0));
            await assertRevert(this.token.claim(owner, amount, 0, signature, { from }));
          });
        });
      });

      describe('when the sender has not a valid signature', function () {
        const from = anotherAccount;

        describe('when the token minting is not finished', function () {
          it('reverts', async function () {
            const signature = web3.eth.sign(from, soliditySha3(this.token.address, owner, amount, 0));
            await assertRevert(this.token.claim(owner, amount, 0, signature, { from }));
            await assertRevert(this.token.claim(owner, amount, 0, signature, { owner }));
          });
        });

        describe('when the token minting is already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            const signature = web3.eth.sign(from, soliditySha3(this.token.address, owner, amount, 0));
            await assertRevert(this.token.claim(owner, amount, 0, signature, { from }));
          });
        });
      });
    });
  });
};
