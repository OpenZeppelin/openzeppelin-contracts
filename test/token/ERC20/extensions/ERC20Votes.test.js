/* eslint-disable */

const { BN, constants, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS } = constants;

const { shouldBehaveLikeVotes } = require('../../../governance/utils/Votes.behavior');
const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { batchInBlock } = require('../../../helpers/txpool');
const { getDomain, domainType } = require('../../../helpers/eip712');
const { clock, clockFromReceipt } = require('../../../helpers/time');
const { expectRevertCustomError } = require('../../../helpers/customError');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

const MODES = {
  blocknumber: artifacts.require('$ERC20Votes'),
  timestamp: artifacts.require('$ERC20VotesTimestampMock'),
};

contract('ERC20Votes', function (accounts) {
  const [holder, recipient, holderDelegatee, other1, other2] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const version = '1';
  const supply = new BN('10000000000000000000000000');

  for (const [mode, artifact] of Object.entries(MODES)) {
    describe(`vote with ${mode}`, function () {
      beforeEach(async function () {
        this.token = await artifact.new(name, symbol, name, version);
        this.votes = this.token;
      });

      // includes EIP6372 behavior check
      shouldBehaveLikeVotes(accounts, [1, 17, 42], { mode, fungible: true });

      it('initial nonce is 0', async function () {
        expect(await this.token.nonces(holder)).to.be.bignumber.equal('0');
      });

      it('minting restriction', async function () {
        const value = web3.utils.toBN(1).shln(208);
        await expectRevertCustomError(this.token.$_mint(holder, value), 'ERC20ExceededSafeSupply', [
          value,
          value.subn(1),
        ]);
      });

      it('recent checkpoints', async function () {
        await this.token.delegate(holder, { from: holder });
        for (let i = 0; i < 6; i++) {
          await this.token.$_mint(holder, 1);
        }
        const timepoint = await clock[mode]();
        expect(await this.token.numCheckpoints(holder)).to.be.bignumber.equal('6');
        // recent
        expect(await this.token.getPastVotes(holder, timepoint - 1)).to.be.bignumber.equal('5');
        // non-recent
        expect(await this.token.getPastVotes(holder, timepoint - 6)).to.be.bignumber.equal('0');
      });

      describe('set delegation', function () {
        describe('call', function () {
          it('delegation with balance', async function () {
            await this.token.$_mint(holder, supply);
            expect(await this.token.delegates(holder)).to.be.equal(ZERO_ADDRESS);

            const { receipt } = await this.token.delegate(holder, { from: holder });
            const timepoint = await clockFromReceipt[mode](receipt);

            expectEvent(receipt, 'DelegateChanged', {
              delegator: holder,
              fromDelegate: ZERO_ADDRESS,
              toDelegate: holder,
            });
            expectEvent(receipt, 'DelegateVotesChanged', {
              delegate: holder,
              previousVotes: '0',
              newVotes: supply,
            });

            expect(await this.token.delegates(holder)).to.be.equal(holder);

            expect(await this.token.getVotes(holder)).to.be.bignumber.equal(supply);
            expect(await this.token.getPastVotes(holder, timepoint - 1)).to.be.bignumber.equal('0');
            await time.advanceBlock();
            expect(await this.token.getPastVotes(holder, timepoint)).to.be.bignumber.equal(supply);
          });

          it('delegation without balance', async function () {
            expect(await this.token.delegates(holder)).to.be.equal(ZERO_ADDRESS);

            const { receipt } = await this.token.delegate(holder, { from: holder });
            expectEvent(receipt, 'DelegateChanged', {
              delegator: holder,
              fromDelegate: ZERO_ADDRESS,
              toDelegate: holder,
            });
            expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

            expect(await this.token.delegates(holder)).to.be.equal(holder);
          });
        });

        describe('with signature', function () {
          const delegator = Wallet.generate();
          const delegatorAddress = web3.utils.toChecksumAddress(delegator.getAddressString());
          const nonce = 0;

          const buildData = (contract, message) =>
            getDomain(contract).then(domain => ({
              primaryType: 'Delegation',
              types: { EIP712Domain: domainType(domain), Delegation },
              domain,
              message,
            }));

          beforeEach(async function () {
            await this.token.$_mint(delegatorAddress, supply);
          });

          it('accept signed delegation', async function () {
            const { v, r, s } = await buildData(this.token, {
              delegatee: delegatorAddress,
              nonce,
              expiry: MAX_UINT256,
            }).then(data => fromRpcSig(ethSigUtil.signTypedMessage(delegator.getPrivateKey(), { data })));

            expect(await this.token.delegates(delegatorAddress)).to.be.equal(ZERO_ADDRESS);

            const { receipt } = await this.token.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);
            const timepoint = await clockFromReceipt[mode](receipt);

            expectEvent(receipt, 'DelegateChanged', {
              delegator: delegatorAddress,
              fromDelegate: ZERO_ADDRESS,
              toDelegate: delegatorAddress,
            });
            expectEvent(receipt, 'DelegateVotesChanged', {
              delegate: delegatorAddress,
              previousVotes: '0',
              newVotes: supply,
            });

            expect(await this.token.delegates(delegatorAddress)).to.be.equal(delegatorAddress);

            expect(await this.token.getVotes(delegatorAddress)).to.be.bignumber.equal(supply);
            expect(await this.token.getPastVotes(delegatorAddress, timepoint - 1)).to.be.bignumber.equal('0');
            await time.advanceBlock();
            expect(await this.token.getPastVotes(delegatorAddress, timepoint)).to.be.bignumber.equal(supply);
          });

          it('rejects reused signature', async function () {
            const { v, r, s } = await buildData(this.token, {
              delegatee: delegatorAddress,
              nonce,
              expiry: MAX_UINT256,
            }).then(data => fromRpcSig(ethSigUtil.signTypedMessage(delegator.getPrivateKey(), { data })));

            await this.token.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s);

            await expectRevertCustomError(
              this.token.delegateBySig(delegatorAddress, nonce, MAX_UINT256, v, r, s),
              'InvalidAccountNonce',
              [delegatorAddress, nonce + 1],
            );
          });

          it('rejects bad delegatee', async function () {
            const { v, r, s } = await buildData(this.token, {
              delegatee: delegatorAddress,
              nonce,
              expiry: MAX_UINT256,
            }).then(data => fromRpcSig(ethSigUtil.signTypedMessage(delegator.getPrivateKey(), { data })));

            const receipt = await this.token.delegateBySig(holderDelegatee, nonce, MAX_UINT256, v, r, s);
            const { args } = receipt.logs.find(({ event }) => event == 'DelegateChanged');
            expect(args.delegator).to.not.be.equal(delegatorAddress);
            expect(args.fromDelegate).to.be.equal(ZERO_ADDRESS);
            expect(args.toDelegate).to.be.equal(holderDelegatee);
          });

          it('rejects bad nonce', async function () {
            const sig = await buildData(this.token, {
              delegatee: delegatorAddress,
              nonce,
              expiry: MAX_UINT256,
            }).then(data => ethSigUtil.signTypedMessage(delegator.getPrivateKey(), { data }));
            const { r, s, v } = fromRpcSig(sig);

            const domain = await getDomain(this.token);
            const typedMessage = {
              primaryType: 'Delegation',
              types: { EIP712Domain: domainType(domain), Delegation },
              domain,
              message: { delegatee: delegatorAddress, nonce: nonce + 1, expiry: MAX_UINT256 },
            };

            await expectRevertCustomError(
              this.token.delegateBySig(delegatorAddress, nonce + 1, MAX_UINT256, v, r, s),
              'InvalidAccountNonce',
              [ethSigUtil.recoverTypedSignature({ data: typedMessage, sig }), nonce],
            );
          });

          it('rejects expired permit', async function () {
            const expiry = (await time.latest()) - time.duration.weeks(1);
            const { v, r, s } = await buildData(this.token, {
              delegatee: delegatorAddress,
              nonce,
              expiry,
            }).then(data => fromRpcSig(ethSigUtil.signTypedMessage(delegator.getPrivateKey(), { data })));

            await expectRevertCustomError(
              this.token.delegateBySig(delegatorAddress, nonce, expiry, v, r, s),
              'VotesExpiredSignature',
              [expiry],
            );
          });
        });
      });

      describe('change delegation', function () {
        beforeEach(async function () {
          await this.token.$_mint(holder, supply);
          await this.token.delegate(holder, { from: holder });
        });

        it('call', async function () {
          expect(await this.token.delegates(holder)).to.be.equal(holder);

          const { receipt } = await this.token.delegate(holderDelegatee, { from: holder });
          const timepoint = await clockFromReceipt[mode](receipt);

          expectEvent(receipt, 'DelegateChanged', {
            delegator: holder,
            fromDelegate: holder,
            toDelegate: holderDelegatee,
          });
          expectEvent(receipt, 'DelegateVotesChanged', {
            delegate: holder,
            previousVotes: supply,
            newVotes: '0',
          });
          expectEvent(receipt, 'DelegateVotesChanged', {
            delegate: holderDelegatee,
            previousVotes: '0',
            newVotes: supply,
          });

          expect(await this.token.delegates(holder)).to.be.equal(holderDelegatee);

          expect(await this.token.getVotes(holder)).to.be.bignumber.equal('0');
          expect(await this.token.getVotes(holderDelegatee)).to.be.bignumber.equal(supply);
          expect(await this.token.getPastVotes(holder, timepoint - 1)).to.be.bignumber.equal(supply);
          expect(await this.token.getPastVotes(holderDelegatee, timepoint - 1)).to.be.bignumber.equal('0');
          await time.advanceBlock();
          expect(await this.token.getPastVotes(holder, timepoint)).to.be.bignumber.equal('0');
          expect(await this.token.getPastVotes(holderDelegatee, timepoint)).to.be.bignumber.equal(supply);
        });
      });

      describe('transfers', function () {
        beforeEach(async function () {
          await this.token.$_mint(holder, supply);
        });

        it('no delegation', async function () {
          const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
          expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
          expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

          this.holderVotes = '0';
          this.recipientVotes = '0';
        });

        it('sender delegation', async function () {
          await this.token.delegate(holder, { from: holder });

          const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
          expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
          expectEvent(receipt, 'DelegateVotesChanged', {
            delegate: holder,
            previousVotes: supply,
            newVotes: supply.subn(1),
          });

          const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
          expect(
            receipt.logs
              .filter(({ event }) => event == 'DelegateVotesChanged')
              .every(({ logIndex }) => transferLogIndex < logIndex),
          ).to.be.equal(true);

          this.holderVotes = supply.subn(1);
          this.recipientVotes = '0';
        });

        it('receiver delegation', async function () {
          await this.token.delegate(recipient, { from: recipient });

          const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
          expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
          expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousVotes: '0', newVotes: '1' });

          const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
          expect(
            receipt.logs
              .filter(({ event }) => event == 'DelegateVotesChanged')
              .every(({ logIndex }) => transferLogIndex < logIndex),
          ).to.be.equal(true);

          this.holderVotes = '0';
          this.recipientVotes = '1';
        });

        it('full delegation', async function () {
          await this.token.delegate(holder, { from: holder });
          await this.token.delegate(recipient, { from: recipient });

          const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
          expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
          expectEvent(receipt, 'DelegateVotesChanged', {
            delegate: holder,
            previousVotes: supply,
            newVotes: supply.subn(1),
          });
          expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousVotes: '0', newVotes: '1' });

          const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
          expect(
            receipt.logs
              .filter(({ event }) => event == 'DelegateVotesChanged')
              .every(({ logIndex }) => transferLogIndex < logIndex),
          ).to.be.equal(true);

          this.holderVotes = supply.subn(1);
          this.recipientVotes = '1';
        });

        afterEach(async function () {
          expect(await this.token.getVotes(holder)).to.be.bignumber.equal(this.holderVotes);
          expect(await this.token.getVotes(recipient)).to.be.bignumber.equal(this.recipientVotes);

          // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
          const timepoint = await clock[mode]();
          await time.advanceBlock();
          expect(await this.token.getPastVotes(holder, timepoint)).to.be.bignumber.equal(this.holderVotes);
          expect(await this.token.getPastVotes(recipient, timepoint)).to.be.bignumber.equal(this.recipientVotes);
        });
      });

      // The following tests are a adaptation of https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
      describe('Compound test suite', function () {
        beforeEach(async function () {
          await this.token.$_mint(holder, supply);
        });

        describe('balanceOf', function () {
          it('grants to initial account', async function () {
            expect(await this.token.balanceOf(holder)).to.be.bignumber.equal('10000000000000000000000000');
          });
        });

        describe('numCheckpoints', function () {
          it('returns the number of checkpoints for a delegate', async function () {
            await this.token.transfer(recipient, '100', { from: holder }); //give an account a few tokens for readability
            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('0');

            const t1 = await this.token.delegate(other1, { from: recipient });
            t1.timepoint = await clockFromReceipt[mode](t1.receipt);
            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('1');

            const t2 = await this.token.transfer(other2, 10, { from: recipient });
            t2.timepoint = await clockFromReceipt[mode](t2.receipt);
            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('2');

            const t3 = await this.token.transfer(other2, 10, { from: recipient });
            t3.timepoint = await clockFromReceipt[mode](t3.receipt);
            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('3');

            const t4 = await this.token.transfer(recipient, 20, { from: holder });
            t4.timepoint = await clockFromReceipt[mode](t4.receipt);
            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('4');

            expect(await this.token.checkpoints(other1, 0)).to.be.deep.equal([t1.timepoint.toString(), '100']);
            expect(await this.token.checkpoints(other1, 1)).to.be.deep.equal([t2.timepoint.toString(), '90']);
            expect(await this.token.checkpoints(other1, 2)).to.be.deep.equal([t3.timepoint.toString(), '80']);
            expect(await this.token.checkpoints(other1, 3)).to.be.deep.equal([t4.timepoint.toString(), '100']);

            await time.advanceBlock();
            expect(await this.token.getPastVotes(other1, t1.timepoint)).to.be.bignumber.equal('100');
            expect(await this.token.getPastVotes(other1, t2.timepoint)).to.be.bignumber.equal('90');
            expect(await this.token.getPastVotes(other1, t3.timepoint)).to.be.bignumber.equal('80');
            expect(await this.token.getPastVotes(other1, t4.timepoint)).to.be.bignumber.equal('100');
          });

          it('does not add more than one checkpoint in a block', async function () {
            await this.token.transfer(recipient, '100', { from: holder });
            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('0');

            const [t1, t2, t3] = await batchInBlock([
              () => this.token.delegate(other1, { from: recipient, gas: 200000 }),
              () => this.token.transfer(other2, 10, { from: recipient, gas: 200000 }),
              () => this.token.transfer(other2, 10, { from: recipient, gas: 200000 }),
            ]);
            t1.timepoint = await clockFromReceipt[mode](t1.receipt);
            t2.timepoint = await clockFromReceipt[mode](t2.receipt);
            t3.timepoint = await clockFromReceipt[mode](t3.receipt);

            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('1');
            expect(await this.token.checkpoints(other1, 0)).to.be.deep.equal([t1.timepoint.toString(), '80']);

            const t4 = await this.token.transfer(recipient, 20, { from: holder });
            t4.timepoint = await clockFromReceipt[mode](t4.receipt);

            expect(await this.token.numCheckpoints(other1)).to.be.bignumber.equal('2');
            expect(await this.token.checkpoints(other1, 1)).to.be.deep.equal([t4.timepoint.toString(), '100']);
          });
        });

        describe('getPastVotes', function () {
          it('reverts if block number >= current block', async function () {
            const clock = await this.token.clock();
            await expectRevertCustomError(this.token.getPastVotes(other1, 5e10), 'ERC5805FutureLookup', [5e10, clock]);
          });

          it('returns 0 if there are no checkpoints', async function () {
            expect(await this.token.getPastVotes(other1, 0)).to.be.bignumber.equal('0');
          });

          it('returns the latest block if >= last checkpoint block', async function () {
            const { receipt } = await this.token.delegate(other1, { from: holder });
            const timepoint = await clockFromReceipt[mode](receipt);
            await time.advanceBlock();
            await time.advanceBlock();

            expect(await this.token.getPastVotes(other1, timepoint)).to.be.bignumber.equal(
              '10000000000000000000000000',
            );
            expect(await this.token.getPastVotes(other1, timepoint + 1)).to.be.bignumber.equal(
              '10000000000000000000000000',
            );
          });

          it('returns zero if < first checkpoint block', async function () {
            await time.advanceBlock();
            const { receipt } = await this.token.delegate(other1, { from: holder });
            const timepoint = await clockFromReceipt[mode](receipt);
            await time.advanceBlock();
            await time.advanceBlock();

            expect(await this.token.getPastVotes(other1, timepoint - 1)).to.be.bignumber.equal('0');
            expect(await this.token.getPastVotes(other1, timepoint + 1)).to.be.bignumber.equal(
              '10000000000000000000000000',
            );
          });

          it('generally returns the voting balance at the appropriate checkpoint', async function () {
            const t1 = await this.token.delegate(other1, { from: holder });
            await time.advanceBlock();
            await time.advanceBlock();
            const t2 = await this.token.transfer(other2, 10, { from: holder });
            await time.advanceBlock();
            await time.advanceBlock();
            const t3 = await this.token.transfer(other2, 10, { from: holder });
            await time.advanceBlock();
            await time.advanceBlock();
            const t4 = await this.token.transfer(holder, 20, { from: other2 });
            await time.advanceBlock();
            await time.advanceBlock();

            t1.timepoint = await clockFromReceipt[mode](t1.receipt);
            t2.timepoint = await clockFromReceipt[mode](t2.receipt);
            t3.timepoint = await clockFromReceipt[mode](t3.receipt);
            t4.timepoint = await clockFromReceipt[mode](t4.receipt);

            expect(await this.token.getPastVotes(other1, t1.timepoint - 1)).to.be.bignumber.equal('0');
            expect(await this.token.getPastVotes(other1, t1.timepoint)).to.be.bignumber.equal(
              '10000000000000000000000000',
            );
            expect(await this.token.getPastVotes(other1, t1.timepoint + 1)).to.be.bignumber.equal(
              '10000000000000000000000000',
            );
            expect(await this.token.getPastVotes(other1, t2.timepoint)).to.be.bignumber.equal(
              '9999999999999999999999990',
            );
            expect(await this.token.getPastVotes(other1, t2.timepoint + 1)).to.be.bignumber.equal(
              '9999999999999999999999990',
            );
            expect(await this.token.getPastVotes(other1, t3.timepoint)).to.be.bignumber.equal(
              '9999999999999999999999980',
            );
            expect(await this.token.getPastVotes(other1, t3.timepoint + 1)).to.be.bignumber.equal(
              '9999999999999999999999980',
            );
            expect(await this.token.getPastVotes(other1, t4.timepoint)).to.be.bignumber.equal(
              '10000000000000000000000000',
            );
            expect(await this.token.getPastVotes(other1, t4.timepoint + 1)).to.be.bignumber.equal(
              '10000000000000000000000000',
            );
          });
        });
      });

      describe('getPastTotalSupply', function () {
        beforeEach(async function () {
          await this.token.delegate(holder, { from: holder });
        });

        it('reverts if block number >= current block', async function () {
          const clock = await this.token.clock();
          await expectRevertCustomError(this.token.getPastTotalSupply(5e10), 'ERC5805FutureLookup', [5e10, clock]);
        });

        it('returns 0 if there are no checkpoints', async function () {
          expect(await this.token.getPastTotalSupply(0)).to.be.bignumber.equal('0');
        });

        it('returns the latest block if >= last checkpoint block', async function () {
          const { receipt } = await this.token.$_mint(holder, supply);
          const timepoint = await clockFromReceipt[mode](receipt);
          await time.advanceBlock();
          await time.advanceBlock();

          expect(await this.token.getPastTotalSupply(timepoint)).to.be.bignumber.equal(supply);
          expect(await this.token.getPastTotalSupply(timepoint + 1)).to.be.bignumber.equal(supply);
        });

        it('returns zero if < first checkpoint block', async function () {
          await time.advanceBlock();
          const { receipt } = await this.token.$_mint(holder, supply);
          const timepoint = await clockFromReceipt[mode](receipt);
          await time.advanceBlock();
          await time.advanceBlock();

          expect(await this.token.getPastTotalSupply(timepoint - 1)).to.be.bignumber.equal('0');
          expect(await this.token.getPastTotalSupply(timepoint + 1)).to.be.bignumber.equal(
            '10000000000000000000000000',
          );
        });

        it('generally returns the voting balance at the appropriate checkpoint', async function () {
          const t1 = await this.token.$_mint(holder, supply);
          await time.advanceBlock();
          await time.advanceBlock();
          const t2 = await this.token.$_burn(holder, 10);
          await time.advanceBlock();
          await time.advanceBlock();
          const t3 = await this.token.$_burn(holder, 10);
          await time.advanceBlock();
          await time.advanceBlock();
          const t4 = await this.token.$_mint(holder, 20);
          await time.advanceBlock();
          await time.advanceBlock();

          t1.timepoint = await clockFromReceipt[mode](t1.receipt);
          t2.timepoint = await clockFromReceipt[mode](t2.receipt);
          t3.timepoint = await clockFromReceipt[mode](t3.receipt);
          t4.timepoint = await clockFromReceipt[mode](t4.receipt);

          expect(await this.token.getPastTotalSupply(t1.timepoint - 1)).to.be.bignumber.equal('0');
          expect(await this.token.getPastTotalSupply(t1.timepoint)).to.be.bignumber.equal('10000000000000000000000000');
          expect(await this.token.getPastTotalSupply(t1.timepoint + 1)).to.be.bignumber.equal(
            '10000000000000000000000000',
          );
          expect(await this.token.getPastTotalSupply(t2.timepoint)).to.be.bignumber.equal('9999999999999999999999990');
          expect(await this.token.getPastTotalSupply(t2.timepoint + 1)).to.be.bignumber.equal(
            '9999999999999999999999990',
          );
          expect(await this.token.getPastTotalSupply(t3.timepoint)).to.be.bignumber.equal('9999999999999999999999980');
          expect(await this.token.getPastTotalSupply(t3.timepoint + 1)).to.be.bignumber.equal(
            '9999999999999999999999980',
          );
          expect(await this.token.getPastTotalSupply(t4.timepoint)).to.be.bignumber.equal('10000000000000000000000000');
          expect(await this.token.getPastTotalSupply(t4.timepoint + 1)).to.be.bignumber.equal(
            '10000000000000000000000000',
          );
        });
      });
    });
  }
});
