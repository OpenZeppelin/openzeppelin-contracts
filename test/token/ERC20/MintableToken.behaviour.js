import assertRevert from '../../helpers/assertRevert';
import { soliditySha3 } from 'web3-utils';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function ([owner, anotherAccount, minter]) {
  describe('as a basic mintable token', function () {
    describe('after token creation', function () {
      it('sender should be token owner', async function () {
        const tokenOwner = await this.token.owner({ from: owner });
        tokenOwner.should.equal(owner);
      });
    });

    describe('minting finished', function () {
      describe('when the token minting is not finished', function () {
        it('returns false', async function () {
          const mintingFinished = await this.token.mintingFinished();
          assert.equal(mintingFinished, false);
        });
      });

      describe('when the token is minting finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('returns true', async function () {
          const mintingFinished = await this.token.mintingFinished();
          assert.equal(mintingFinished, true);
        });
      });
    });

    describe('finish minting', function () {
      describe('when the sender is the token owner', function () {
        const from = owner;

        describe('when the token minting was not finished', function () {
          it('finishes token minting', async function () {
            await this.token.finishMinting({ from });

            const mintingFinished = await this.token.mintingFinished();
            assert.equal(mintingFinished, true);
          });

          it('emits a mint finished event', async function () {
            const { logs } = await this.token.finishMinting({ from });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'MintFinished');
          });
        });

        describe('when the token minting was already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from });
          });

          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });
      });

      describe('when the sender is not the token owner', function () {
        const from = anotherAccount;

        describe('when the token minting was not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });

        describe('when the token minting was already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });
      });
    });

    describe('mint', function () {
      const amount = 100;

      describe('when the sender has the minting permission', function () {
        const from = minter;

        describe('when the token minting is not finished', function () {
          it('mints the requested amount', async function () {
            await this.token.mint(owner, amount, { from });

            const balance = await this.token.balanceOf(owner);
            assert.equal(balance, amount);
          });

          it('mints the requested amount to the agreed upon address with a signed proof from any address', async function () {
            const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
            await this.token.mintWithSignature(anotherAccount, amount, 0, signature, { from });

            const balance = await this.token.balanceOf(anotherAccount);
            assert.equal(amount, balance);
          });

          it('mints the requested amount from the same signed proof should fail', async function () {
            const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
            await this.token.mintWithSignature(anotherAccount, amount, 0, signature, { anotherAccount });
            await assertRevert(this.token.mintWithSignature(anotherAccount, amount, 0, signature, { anotherAccount }));
            await assertRevert(this.token.mintWithSignature(anotherAccount, amount, 0, signature, { owner }));
            await assertRevert(this.token.mintWithSignature(anotherAccount, amount, 0, signature, { minter }));
          });

          it('mints the requested amount twice from the different signed proof', async function () {
            const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
            const signature2 = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 1));

            await this.token.mintWithSignature(anotherAccount, amount, 0, signature, { anotherAccount });
            await this.token.mintWithSignature(anotherAccount, amount, 1, signature2, { anotherAccount });
            
            const balance = await this.token.balanceOf(anotherAccount);
            assert.equal(amount+amount, balance);
          });

          it('mints with different parameters than the signed proof should fail', async function () {
            const signature = web3.eth.sign(owner, soliditySha3(this.token.address, anotherAccount, amount, 0));
            await assertRevert(this.token.mintWithSignature(anotherAccount, amount+1, 0, signature, { anotherAccount }));
            await assertRevert(this.token.mintWithSignature(anotherAccount, amount, 1, signature, { anotherAccount }));
            await assertRevert(this.token.mintWithSignature(owner, amount, 0, signature, { anotherAccount }));
          });

          it('emits a mint and a transfer event', async function () {
            const { logs } = await this.token.mint(owner, amount, { from });

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'Mint');
            assert.equal(logs[0].args.to, owner);
            assert.equal(logs[0].args.amount, amount);
            assert.equal(logs[1].event, 'Transfer');
          });
        });

        describe('when the token minting is finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mint(owner, amount, { from }));
          });

          it('reverts', async function () {
            const signature = web3.eth.sign(from, soliditySha3(this.token.address, owner, amount, 0));
            await assertRevert(this.token.mintWithSignature(owner, amount, 0, signature, { from }));
          });
        });
      });

      describe('when the sender has not the minting permission', function () {
        const from = anotherAccount;

        describe('when the token minting is not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.mint(owner, amount, { from }));
          });
          it('reverts', async function () {
            const signature = web3.eth.sign(from, soliditySha3(this.token.address, owner, amount, 0));
            await assertRevert(this.token.mintWithSignature(owner, amount, 0, signature, { from }));
            await assertRevert(this.token.mintWithSignature(owner, amount, 0, signature, { owner }));
          });
        });

        describe('when the token minting is already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mint(owner, amount, { from }));
          });

          it('reverts', async function () {
            const signature = web3.eth.sign(from, soliditySha3(this.token.address, owner, amount, 0));
            await assertRevert(this.token.mintWithSignature(owner, amount, 0, signature, { from }));
          });
        });
      });
    });
  });
};
