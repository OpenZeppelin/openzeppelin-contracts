const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

const { MAX_UINT256, ZERO_ADDRESS } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { shouldBehaveLikeEIP6372 } = require('./EIP6372.behavior');
const { getDomain, domainType, domainSeparator } = require('../../helpers/eip712');
const { clockFromReceipt } = require('../../helpers/time');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

const buildAndSignDelegation = (contract, message, pk) =>
  getDomain(contract)
    .then(domain => ({
      primaryType: 'Delegation',
      types: { EIP712Domain: domainType(domain), Delegation },
      domain,
      message,
    }))
    .then(data => fromRpcSig(ethSigUtil.signTypedMessage(pk, { data })));

function shouldBehaveLikeVotes(accounts, tokens, { mode = 'blocknumber', fungible = true }) {
  shouldBehaveLikeEIP6372(mode);

  const getWeight = token => web3.utils.toBN(fungible ? token : 1);

  describe('run votes workflow', function () {
    it('initial nonce is 0', async function () {
      expect(await this.votes.nonces(accounts[0])).to.be.bignumber.equal('0');
    });

    it('domain separator', async function () {
      expect(await this.votes.DOMAIN_SEPARATOR()).to.equal(domainSeparator(await getDomain(this.votes)));
    });

    describe('delegation with signature', function () {
      const token = tokens[0];

      it('delegation without tokens', async function () {
        expect(await this.votes.delegates(accounts[1])).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.votes.delegate(accounts[1], { from: accounts[1] });
        expectEvent(receipt, 'DelegateChanged', {
          delegator: accounts[1],
          fromDelegate: ZERO_ADDRESS,
          toDelegate: accounts[1],
        });
        expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

        expect(await this.votes.delegates(accounts[1])).to.be.equal(accounts[1]);
      });

      it('delegation with tokens', async function () {
        await this.votes.$_mint(accounts[1], token);
        const weight = getWeight(token);

        expect(await this.votes.delegates(accounts[1])).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.votes.delegate(accounts[1], { from: accounts[1] });
        const timepoint = await clockFromReceipt[mode](receipt);

        expectEvent(receipt, 'DelegateChanged', {
          delegator: accounts[1],
          fromDelegate: ZERO_ADDRESS,
          toDelegate: accounts[1],
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: accounts[1],
          previousBalance: '0',
          newBalance: weight,
        });

        expect(await this.votes.delegates(accounts[1])).to.be.equal(accounts[1]);
        expect(await this.votes.getVotes(accounts[1])).to.be.bignumber.equal(weight);
        expect(await this.votes.getPastVotes(accounts[1], timepoint - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(accounts[1], timepoint)).to.be.bignumber.equal(weight);
      });

      it('delegation update', async function () {
        await this.votes.delegate(accounts[1], { from: accounts[1] });
        await this.votes.$_mint(accounts[1], token);
        const weight = getWeight(token);

        expect(await this.votes.delegates(accounts[1])).to.be.equal(accounts[1]);
        expect(await this.votes.getVotes(accounts[1])).to.be.bignumber.equal(weight);
        expect(await this.votes.getVotes(accounts[2])).to.be.bignumber.equal('0');

        const { receipt } = await this.votes.delegate(accounts[2], { from: accounts[1] });
        const timepoint = await clockFromReceipt[mode](receipt);

        expectEvent(receipt, 'DelegateChanged', {
          delegator: accounts[1],
          fromDelegate: accounts[1],
          toDelegate: accounts[2],
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: accounts[1],
          previousBalance: weight,
          newBalance: '0',
        });
        expectEvent(receipt, 'DelegateVotesChanged', {
          delegate: accounts[2],
          previousBalance: '0',
          newBalance: weight,
        });

        expect(await this.votes.delegates(accounts[1])).to.be.equal(accounts[2]);
        expect(await this.votes.getVotes(accounts[1])).to.be.bignumber.equal('0');
        expect(await this.votes.getVotes(accounts[2])).to.be.bignumber.equal(weight);

        expect(await this.votes.getPastVotes(accounts[1], timepoint - 1)).to.be.bignumber.equal(weight);
        expect(await this.votes.getPastVotes(accounts[2], timepoint - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(accounts[1], timepoint)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastVotes(accounts[2], timepoint)).to.be.bignumber.equal(weight);
      });

      describe('with signature', function () {
        const delegator = Wallet.generate();
        const [delegatee, other] = accounts;
        const nonce = 0;
        delegator.address = web3.utils.toChecksumAddress(delegator.getAddressString());

        it('accept signed delegation', async function () {
          await this.votes.$_mint(delegator.address, token);
          const weight = getWeight(token);

          const { v, r, s } = await buildAndSignDelegation(
            this.votes,
            {
              delegatee,
              nonce,
              expiry: MAX_UINT256,
            },
            delegator.getPrivateKey(),
          );

          expect(await this.votes.delegates(delegator.address)).to.be.equal(ZERO_ADDRESS);

          const { receipt } = await this.votes.delegateBySig(delegatee, nonce, MAX_UINT256, v, r, s);
          const timepoint = await clockFromReceipt[mode](receipt);

          expectEvent(receipt, 'DelegateChanged', {
            delegator: delegator.address,
            fromDelegate: ZERO_ADDRESS,
            toDelegate: delegatee,
          });
          expectEvent(receipt, 'DelegateVotesChanged', {
            delegate: delegatee,
            previousBalance: '0',
            newBalance: weight,
          });

          expect(await this.votes.delegates(delegator.address)).to.be.equal(delegatee);
          expect(await this.votes.getVotes(delegator.address)).to.be.bignumber.equal('0');
          expect(await this.votes.getVotes(delegatee)).to.be.bignumber.equal(weight);
          expect(await this.votes.getPastVotes(delegatee, timepoint - 1)).to.be.bignumber.equal('0');
          await time.advanceBlock();
          expect(await this.votes.getPastVotes(delegatee, timepoint)).to.be.bignumber.equal(weight);
        });

        it('rejects reused signature', async function () {
          const { v, r, s } = await buildAndSignDelegation(
            this.votes,
            {
              delegatee,
              nonce,
              expiry: MAX_UINT256,
            },
            delegator.getPrivateKey(),
          );

          await this.votes.delegateBySig(delegatee, nonce, MAX_UINT256, v, r, s);

          await expectRevert(this.votes.delegateBySig(delegatee, nonce, MAX_UINT256, v, r, s), 'Votes: invalid nonce');
        });

        it('rejects bad delegatee', async function () {
          const { v, r, s } = await buildAndSignDelegation(
            this.votes,
            {
              delegatee,
              nonce,
              expiry: MAX_UINT256,
            },
            delegator.getPrivateKey(),
          );

          const receipt = await this.votes.delegateBySig(other, nonce, MAX_UINT256, v, r, s);
          const { args } = receipt.logs.find(({ event }) => event === 'DelegateChanged');
          expect(args.delegator).to.not.be.equal(delegator.address);
          expect(args.fromDelegate).to.be.equal(ZERO_ADDRESS);
          expect(args.toDelegate).to.be.equal(other);
        });

        it('rejects bad nonce', async function () {
          const { v, r, s } = await buildAndSignDelegation(
            this.votes,
            {
              delegatee,
              nonce: nonce + 1,
              expiry: MAX_UINT256,
            },
            delegator.getPrivateKey(),
          );

          await expectRevert(
            this.votes.delegateBySig(delegatee, nonce + 1, MAX_UINT256, v, r, s),
            'Votes: invalid nonce',
          );
        });

        it('rejects expired permit', async function () {
          const expiry = (await time.latest()) - time.duration.weeks(1);
          const { v, r, s } = await buildAndSignDelegation(
            this.votes,
            {
              delegatee,
              nonce,
              expiry,
            },
            delegator.getPrivateKey(),
          );

          await expectRevert(this.votes.delegateBySig(delegatee, nonce, expiry, v, r, s), 'Votes: signature expired');
        });
      });
    });

    describe('getPastTotalSupply', function () {
      beforeEach(async function () {
        await this.votes.delegate(accounts[1], { from: accounts[1] });
      });

      it('reverts if block number >= current block', async function () {
        await expectRevert(this.votes.getPastTotalSupply(5e10), 'future lookup');
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.votes.getPastTotalSupply(0)).to.be.bignumber.equal('0');
      });

      it('returns the correct checkpointed total supply', async function () {
        const weight = tokens.map(token => getWeight(token));

        // t0 = mint #0
        const t0 = await this.votes.$_mint(accounts[1], tokens[0]);
        await time.advanceBlock();
        // t1 = mint #1
        const t1 = await this.votes.$_mint(accounts[1], tokens[1]);
        await time.advanceBlock();
        // t2 = burn #1
        const t2 = await this.votes.$_burn(...(fungible ? [accounts[1]] : []), tokens[1]);
        await time.advanceBlock();
        // t3 = mint #2
        const t3 = await this.votes.$_mint(accounts[1], tokens[2]);
        await time.advanceBlock();
        // t4 = burn #0
        const t4 = await this.votes.$_burn(...(fungible ? [accounts[1]] : []), tokens[0]);
        await time.advanceBlock();
        // t5 = burn #2
        const t5 = await this.votes.$_burn(...(fungible ? [accounts[1]] : []), tokens[2]);
        await time.advanceBlock();

        t0.timepoint = await clockFromReceipt[mode](t0.receipt);
        t1.timepoint = await clockFromReceipt[mode](t1.receipt);
        t2.timepoint = await clockFromReceipt[mode](t2.receipt);
        t3.timepoint = await clockFromReceipt[mode](t3.receipt);
        t4.timepoint = await clockFromReceipt[mode](t4.receipt);
        t5.timepoint = await clockFromReceipt[mode](t5.receipt);

        expect(await this.votes.getPastTotalSupply(t0.timepoint - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(t0.timepoint)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t0.timepoint + 1)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t1.timepoint)).to.be.bignumber.equal(weight[0].add(weight[1]));
        expect(await this.votes.getPastTotalSupply(t1.timepoint + 1)).to.be.bignumber.equal(weight[0].add(weight[1]));
        expect(await this.votes.getPastTotalSupply(t2.timepoint)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t2.timepoint + 1)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(t3.timepoint)).to.be.bignumber.equal(weight[0].add(weight[2]));
        expect(await this.votes.getPastTotalSupply(t3.timepoint + 1)).to.be.bignumber.equal(weight[0].add(weight[2]));
        expect(await this.votes.getPastTotalSupply(t4.timepoint)).to.be.bignumber.equal(weight[2]);
        expect(await this.votes.getPastTotalSupply(t4.timepoint + 1)).to.be.bignumber.equal(weight[2]);
        expect(await this.votes.getPastTotalSupply(t5.timepoint)).to.be.bignumber.equal('0');
        await expectRevert(this.votes.getPastTotalSupply(t5.timepoint + 1), 'Votes: future lookup');
      });
    });

    // The following tests are an adaptation of
    // https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
    describe('Compound test suite', function () {
      beforeEach(async function () {
        await this.votes.$_mint(accounts[1], tokens[0]);
        await this.votes.$_mint(accounts[1], tokens[1]);
        await this.votes.$_mint(accounts[1], tokens[2]);
      });

      describe('getPastVotes', function () {
        it('reverts if block number >= current block', async function () {
          await expectRevert(this.votes.getPastVotes(accounts[2], 5e10), 'future lookup');
        });

        it('returns 0 if there are no checkpoints', async function () {
          expect(await this.votes.getPastVotes(accounts[2], 0)).to.be.bignumber.equal('0');
        });

        it('returns the latest block if >= last checkpoint block', async function () {
          const { receipt } = await this.votes.delegate(accounts[2], { from: accounts[1] });
          const timepoint = await clockFromReceipt[mode](receipt);
          await time.advanceBlock();
          await time.advanceBlock();

          const latest = await this.votes.getVotes(accounts[2]);
          expect(await this.votes.getPastVotes(accounts[2], timepoint)).to.be.bignumber.equal(latest);
          expect(await this.votes.getPastVotes(accounts[2], timepoint + 1)).to.be.bignumber.equal(latest);
        });

        it('returns zero if < first checkpoint block', async function () {
          await time.advanceBlock();
          const { receipt } = await this.votes.delegate(accounts[2], { from: accounts[1] });
          const timepoint = await clockFromReceipt[mode](receipt);
          await time.advanceBlock();
          await time.advanceBlock();

          expect(await this.votes.getPastVotes(accounts[2], timepoint - 1)).to.be.bignumber.equal('0');
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeVotes,
};
