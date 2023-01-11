const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

const { MAX_UINT256, ZERO_ADDRESS } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { EIP712Domain, domainSeparator } = require('../../helpers/eip712');
const { web3 } = require('hardhat');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

const version = '1';

function shouldBehaveLikeVotes (accounts, tokens, fungible = true) {
  const getWeight = token => web3.utils.toBN(fungible ? token : 1);

  describe('run votes workflow', function () {
    it('initial nonce is 0', async function () {
      expect(await this.votes.nonces(accounts[0])).to.be.bignumber.equal('0');
    });

    it('domain separator', async function () {
      expect(
        await this.votes.DOMAIN_SEPARATOR(),
      ).to.equal(
        await domainSeparator(this.name, version, this.chainId, this.votes.address),
      );
    });

    describe('delegation', function () {
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
        await this.votes.mint(accounts[1], tokens[0]);
        const weight = getWeight(tokens[0]);

        expect(await this.votes.delegates(accounts[1])).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.votes.delegate(accounts[1], { from: accounts[1] });
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
        expect(await this.votes.getPastVotes(accounts[1], receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(accounts[1], receipt.blockNumber)).to.be.bignumber.equal(weight);
      });

      it('delegation update', async function () {
        await this.votes.delegate(accounts[1], { from: accounts[1] });
        await this.votes.mint(accounts[1], tokens[0]);
        const weight = getWeight(tokens[0]);

        expect(await this.votes.delegates(accounts[1])).to.be.equal(accounts[1]);
        expect(await this.votes.getVotes(accounts[1])).to.be.bignumber.equal(weight);
        expect(await this.votes.getVotes(accounts[2])).to.be.bignumber.equal('0');

        const { receipt } = await this.votes.delegate(accounts[2], { from: accounts[1] });
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

        expect(await this.votes.getPastVotes(accounts[1], receipt.blockNumber - 1)).to.be.bignumber.equal(weight);
        expect(await this.votes.getPastVotes(accounts[2], receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(accounts[1], receipt.blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastVotes(accounts[2], receipt.blockNumber)).to.be.bignumber.equal(weight);
      });
    });

    describe('delegation with signature', function () {
      const delegator = Wallet.generate();
      const [delegatee, other] = accounts;
      const nonce = 0;
      delegator.address = web3.utils.toChecksumAddress(delegator.getAddressString());

      const buildData = (chainId, verifyingContract, name, message) => ({
        data: {
          primaryType: 'Delegation',
          types: { EIP712Domain, Delegation },
          domain: { name, version, chainId, verifyingContract },
          message,
        },
      });

      it('accept signed delegation', async function () {
        await this.votes.mint(delegator.address, tokens[0]);
        const weight = getWeight(tokens[0]);

        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        expect(await this.votes.delegates(delegator.address)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.votes.delegateBySig(delegatee, nonce, MAX_UINT256, v, r, s);
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
        expect(await this.votes.getPastVotes(delegatee, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.votes.getPastVotes(delegatee, receipt.blockNumber)).to.be.bignumber.equal(weight);
      });

      it('rejects reused signature', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        await this.votes.delegateBySig(delegatee, nonce, MAX_UINT256, v, r, s);

        await expectRevert(
          this.votes.delegateBySig(delegatee, nonce, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects bad delegatee', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        const receipt = await this.votes.delegateBySig(other, nonce, MAX_UINT256, v, r, s);
        const { args } = receipt.logs.find(({ event }) => event === 'DelegateChanged');
        expect(args.delegator).to.not.be.equal(delegator.address);
        expect(args.fromDelegate).to.be.equal(ZERO_ADDRESS);
        expect(args.toDelegate).to.be.equal(other);
      });

      it('rejects bad nonce', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee,
            nonce: nonce + 1,
            expiry: MAX_UINT256,
          }),
        ));
        await expectRevert(
          this.votes.delegateBySig(delegatee, nonce + 1, MAX_UINT256, v, r, s),
          'Votes: invalid nonce',
        );
      });

      it('rejects expired permit', async function () {
        const expiry = (await time.latest()) - time.duration.weeks(1);
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.votes.address, this.name, {
            delegatee,
            nonce,
            expiry,
          }),
        ));

        await expectRevert(
          this.votes.delegateBySig(delegatee, nonce, expiry, v, r, s),
          'Votes: signature expired',
        );
      });
    });

    describe('getPastTotalSupply', function () {
      beforeEach(async function () {
        await this.votes.delegate(accounts[1], { from: accounts[1] });
      });

      it('reverts if block number >= current block', async function () {
        await expectRevert(
          this.votes.getPastTotalSupply(5e10),
          'block not yet mined',
        );
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.votes.getPastTotalSupply(0)).to.be.bignumber.equal('0');
      });

      it('returns the correct checkpointed total supply', async function () {
        const blockNumber = Number(await time.latestBlock());

        await this.votes.mint(accounts[1], tokens[0]); // mint 0
        await time.advanceBlock();
        await this.votes.mint(accounts[1], tokens[1]); // mint 1
        await time.advanceBlock();
        await this.votes.burn(...(fungible ? [accounts[1]] : []), tokens[1]); // burn 1
        await time.advanceBlock();
        await this.votes.mint(accounts[1], tokens[2]); // mint 2
        await time.advanceBlock();
        await this.votes.burn(...(fungible ? [accounts[1]] : []), tokens[0]); // burn 0
        await time.advanceBlock();
        await this.votes.burn(...(fungible ? [accounts[1]] : []), tokens[2]); // burn 2
        await time.advanceBlock();

        const weight = tokens.map(getWeight);

        expect(await this.votes.getPastTotalSupply(blockNumber)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastTotalSupply(blockNumber + 1)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(blockNumber + 2)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(blockNumber + 3)).to.be.bignumber.equal(weight[0].add(weight[1]));
        expect(await this.votes.getPastTotalSupply(blockNumber + 4)).to.be.bignumber.equal(weight[0].add(weight[1]));
        expect(await this.votes.getPastTotalSupply(blockNumber + 5)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(blockNumber + 6)).to.be.bignumber.equal(weight[0]);
        expect(await this.votes.getPastTotalSupply(blockNumber + 7)).to.be.bignumber.equal(weight[0].add(weight[2]));
        expect(await this.votes.getPastTotalSupply(blockNumber + 8)).to.be.bignumber.equal(weight[0].add(weight[2]));
        expect(await this.votes.getPastTotalSupply(blockNumber + 9)).to.be.bignumber.equal(weight[2]);
        expect(await this.votes.getPastTotalSupply(blockNumber + 10)).to.be.bignumber.equal(weight[2]);
        expect(await this.votes.getPastTotalSupply(blockNumber + 11)).to.be.bignumber.equal('0');
        await expectRevert(this.votes.getPastTotalSupply(blockNumber + 12), 'Votes: block not yet mined');
      });
    });

    // The following tests are an adaptation of
    // https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
    describe('Compound test suite', function () {
      beforeEach(async function () {
        await this.votes.mint(accounts[1], tokens[0]);
        await this.votes.mint(accounts[1], tokens[1]);
        await this.votes.mint(accounts[1], tokens[2]);
      });

      describe('getPastVotes', function () {
        it('reverts if block number >= current block', async function () {
          await expectRevert(
            this.votes.getPastVotes(accounts[2], 5e10),
            'block not yet mined',
          );
        });

        it('returns 0 if there are no checkpoints', async function () {
          expect(await this.votes.getPastVotes(accounts[2], 0)).to.be.bignumber.equal('0');
        });

        it('returns the latest block if >= last checkpoint block', async function () {
          const tx = await this.votes.delegate(accounts[2], { from: accounts[1] });
          await time.advanceBlock();
          await time.advanceBlock();
          const latest = await this.votes.getVotes(accounts[2]);
          expect(await this.votes.getPastVotes(accounts[2], tx.receipt.blockNumber)).to.be.bignumber.equal(latest);
          expect(await this.votes.getPastVotes(accounts[2], tx.receipt.blockNumber + 1)).to.be.bignumber.equal(latest);
        });

        it('returns zero if < first checkpoint block', async function () {
          await time.advanceBlock();
          const tx = await this.votes.delegate(accounts[2], { from: accounts[1] });
          await time.advanceBlock();
          await time.advanceBlock();

          expect(await this.votes.getPastVotes(accounts[2], tx.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeVotes,
};
