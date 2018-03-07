import assertRevert from '../../helpers/assertRevert';
const BigNumber = web3.BigNumber;
const ERC721BasicToken = artifacts.require('ERC721BasicTokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721BasicToken', accounts => {
  let token = null;
  const _firstTokenId = 1;
  const _secondTokenId = 2;
  const _unknownTokenId = 3;
  const _creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    token = await ERC721BasicToken.new({ from: _creator });
    await token.mint(_creator, _firstTokenId, { from: _creator });
    await token.mint(_creator, _secondTokenId, { from: _creator });
  });

  describe('balanceOf', function () {
    describe('when the given address owns some tokens', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const balance = await token.balanceOf(_creator);
        balance.should.be.bignumber.equal(2);
      });
    });

    describe('when the given address does not own any tokens', function () {
      it('returns 0', async function () {
        const balance = await token.balanceOf(accounts[1]);
        balance.should.be.bignumber.equal(0);
      });
    });
  });

  describe('exists', function () {
    describe('when the token exists', function () {
      const tokenId = _firstTokenId;

      it('should return true', async function () {
        const result = await token.exists(tokenId);
        result.should.be.true;
      });
    });

    describe('when the token does not exist', function () {
      const tokenId = _unknownTokenId;

      it('should return false', async function () {
        const result = await token.exists(tokenId);
        result.should.be.false;
      });
    });
  });

  describe('ownerOf', function () {
    describe('when the given token ID was tracked by this token', function () {
      const tokenId = _firstTokenId;

      it('returns the owner of the given token ID', async function () {
        const owner = await token.ownerOf(tokenId);
        owner.should.be.equal(_creator);
      });
    });

    describe('when the given token ID was not tracked by this token', function () {
      const tokenId = _unknownTokenId;

      it('reverts', async function () {
        await assertRevert(token.ownerOf(tokenId));
      });
    });
  });

  describe('mint', function () {
    const to = accounts[1];
    const tokenId = _unknownTokenId;
    let logs = null;
    
    describe('when successful', function () {
      beforeEach(async function () {
        const result = await token.mint(to, tokenId);
        logs = result.logs;
      });

      it('assigns the token to the new owner', async function () {
        const owner = await token.ownerOf(tokenId);
        owner.should.be.equal(to);
      });

      it('increases the balance of its owner', async function () {
        const balance = await token.balanceOf(to);
        balance.should.be.bignumber.equal(1);
      });

      it.skip('adds that token to the token list of the owner', async function () {
        await token.mint(to, tokenId);

        const tokens = await token.tokensOf(to);
        tokens.length.should.be.equal(1);
        tokens[0].should.be.bignumber.equal(tokenId);
      });

      it('emits a transfer event', async function () {
        logs.length.should.be.equal(1);
        logs[0].event.should.be.eq('Transfer');
        logs[0].args._from.should.be.equal(ZERO_ADDRESS);
        logs[0].args._to.should.be.equal(to);
        logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
      });
    });

    describe('when the given owner address is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(token.mint(ZERO_ADDRESS, tokenId));
      });
    });

    describe('when the given token ID was already tracked by this contract', function () {
      it('reverts', async function () {
        await assertRevert(token.mint(accounts[1], _firstTokenId));
      });
    });
  });

  describe('burn', function () {
    const tokenId = _firstTokenId;
    const sender = _creator;
    let logs = null;

    describe('when successful', function () {
      beforeEach(async function () {
        const result = await token.burn(tokenId, { from: sender });
        logs = result.logs;
      });

      it('burns the given token ID and adjusts the balance of the owner', async function () {
        await assertRevert(token.ownerOf(tokenId));
        const balance = await token.balanceOf(sender);
        balance.should.be.bignumber.equal(1);
      });

      it.skip('removes that token from the token list of the owner', async function () {
        const tokens = await token.tokensOf(sender);
        tokens.length.should.be.equal(1);
        tokens[0].should.be.bignumber.equal(_secondTokenId);
      });

      it('emits a burn event', async function () {
        logs.length.should.be.equal(1);
        logs[0].event.should.be.eq('Transfer');
        logs[0].args._from.should.be.equal(sender);
        logs[0].args._to.should.be.equal(ZERO_ADDRESS);
        logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
      });
    });

    describe('when there is a previous approval', function () {
      beforeEach(async function () {
        await token.approve(accounts[1], tokenId, { from: sender });
        const result = await token.burn(tokenId, { from: sender });
        logs = result.logs;
      });

      it('clears the approval', async function () {
        const approvedAccount = await token.getApproved(tokenId);
        approvedAccount.should.be.equal(ZERO_ADDRESS);
      });

      it('emits an approval event', async function () {
        logs.length.should.be.equal(2);

        logs[0].event.should.be.eq('Approval');
        logs[0].args._owner.should.be.equal(sender);
        logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
        logs[0].args._tokenId.should.be.bignumber.equal(tokenId);

        logs[1].event.should.be.eq('Transfer');
      });
    });

    describe('when the msg.sender does not own given token', function () {
      it('reverts', async function () {
        await assertRevert(token.burn(tokenId, { from: accounts[1] }));
      });
    });

    describe('when the given token ID was not tracked by this contract', function () {
      it('reverts', async function () {
        await assertRevert(token.burn(_unknownTokenId, { from: _creator }));
      });
    });
  });

  describe('transferFrom', function () {
    const sender = _creator;
    const from = _creator;
    const to = accounts[1];
    const tokenId = _firstTokenId;
    const approved = accounts[2];
    let logs = null;

    describe('when successful', function () {
      beforeEach(async function () {
        await token.approve(approved, tokenId, { from: sender });
        const result = await token.transferFrom(from, to, tokenId, { from: sender });
        logs = result.logs;
      });

      it('transfers the ownership of the given token ID to the given address', async function () {
        const newOwner = await token.ownerOf(tokenId);
        newOwner.should.be.equal(to);
      });

      it('clears the approval for the token ID', async function () {
        const approvedAccount = await token.getApproved(tokenId);
        approvedAccount.should.be.equal(ZERO_ADDRESS);
      });

      it('emits an approval and transfer events', async function () {
        logs.length.should.be.equal(2);

        logs[0].event.should.be.eq('Approval');
        logs[0].args._owner.should.be.equal(sender);
        logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
        logs[0].args._tokenId.should.be.bignumber.equal(tokenId);

        logs[1].event.should.be.eq('Transfer');
        logs[1].args._from.should.be.equal(sender);
        logs[1].args._to.should.be.equal(to);
        logs[1].args._tokenId.should.be.bignumber.equal(tokenId);
      });

      it('adjusts owners balances', async function () {
        const newOwnerBalance = await token.balanceOf(to);
        newOwnerBalance.should.be.bignumber.equal(1);

        const previousOwnerBalance = await token.balanceOf(_creator);
        previousOwnerBalance.should.be.bignumber.equal(1);
      });

      it.skip('adds the token to the tokens list of the new owner', async function () {
        await token.transfer(to, tokenId, { from: sender });

        const tokenIDs = await token.tokensOf(to);
        tokenIDs.length.should.be.equal(1);
        tokenIDs[0].should.be.bignumber.equal(tokenId);
      });
    });
    
    describe('when the address of the previous owner is incorrect', function () {
      it('reverts', async function () {
        await assertRevert(token.transferFrom(accounts[3], to, tokenId, { from: sender }));
      });
    });

    describe('when the msg.sender is not the owner of the given token ID', function () {
      it('reverts', async function () {
        await assertRevert(token.transferFrom(from, to, tokenId, { from: accounts[2] }));
      });
    });

    describe('when the given token ID does not exist', function () {
      it('reverts', async function () {
        await assertRevert(token.transferFrom(from, to, _unknownTokenId, { from: sender }));
      });
    });

    describe('when the address to transfer the token to is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(token.transferFrom(from, to, _unknownTokenId, { from: sender }));
      });
    });
  });

  describe('approve', function () {
    const tokenId = _firstTokenId;
    const sender = _creator;
    const to = accounts[1];

    let logs = null;
    
    describe('when clearing approval', function () {
      describe('when there was no prior approval', function () {
        beforeEach(async function () {
          ({ logs } = await token.approve(ZERO_ADDRESS, tokenId, { from: sender }));
        });

        it('clears the approval for that token', async function () {
          const approvedAccount = await token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });

        it('does not emit an approval event', async function () {
          logs.length.should.be.equal(0);
        });
      });
  
      describe('when there was a prior approval', function () {
        beforeEach(async function () {
          await token.approve(to, tokenId, { from: sender });
          ({ logs } = await token.approve(ZERO_ADDRESS, tokenId, { from: sender }));
        });

        it('clears the approval for that token', async function () {
          const approvedAccount = await token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });

        it('emits an approval event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      });
    });

    describe('when approving a non-zero address', function () {
      describe('when there was no prior approval', function () {
        beforeEach(async function () {
          ({ logs } = await token.approve(to, tokenId, { from: sender }));
        });

        it('sets the approval for that token', async function () {
          const approvedAccount = await token.getApproved(tokenId);
          approvedAccount.should.be.equal(to);
        });

        it('emits an approval event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._approved.should.be.equal(to);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      });

      describe('when there was a prior approval to the same address', function () {
        beforeEach(async function () {
          await token.approve(to, tokenId, { from: sender });
          ({ logs } = await token.approve(to, tokenId, { from: sender }));
        });

        it('keeps the approval for that token', async function () {
          const approvedAccount = await token.getApproved(tokenId);
          approvedAccount.should.be.equal(to);
        });

        it('emits an approval event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._approved.should.be.equal(to);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      });

      describe('when there was a prior approval to a different address', function () {
        beforeEach(async function () {
          await token.approve(accounts[2], tokenId, { from: sender });
          ({ logs } = await token.approve(to, tokenId, { from: sender }));
        });

        it('sets the approval for that token', async function () {
          const approvedAccount = await token.getApproved(tokenId);
          approvedAccount.should.be.equal(to);
        });

        it('emits an approval event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._approved.should.be.equal(to);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      });
    });

    describe('when the address that receives the approval is the owner', function () {
      it('reverts', async function () {
        await assertRevert(token.approve(sender, tokenId, { from: sender }));
      });
    });
    
    describe('when the sender does not own the given token ID', function () {
      it('reverts', async function () {
        await assertRevert(token.approve(to, tokenId, { from: accounts[2] }));
      });
    });

    describe('when the sender is approved for the given token ID', function () {
      it('reverts', async function () {
        await token.approve(accounts[2], tokenId, { from: sender });
        await assertRevert(token.approve(to, tokenId, { from: accounts[2] }));
      });
    });

    describe('when the given token ID does not exist', function () {
      it('reverts', async function () {
        await assertRevert(token.approve(to, _unknownTokenId, { from: sender }));
      });
    });
  });

  describe('setApprovalForAll', function () {
    const sender = _creator;

    describe('when the operator willing to approve is not the owner', function () {
      const operator = accounts[1];

      describe('when there is no operator approval set by the sender', function () {
        it('approves the operator', async function () {
          await token.setApprovalForAll(operator, true, { from: sender });

          const isApproved = await token.isApprovedForAll(sender, operator);
          isApproved.should.be.true;
        });

        it('emits an approval event', async function () {
          const { logs } = await token.setApprovalForAll(operator, true, { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('ApprovalForAll');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._operator.should.be.equal(operator);
          logs[0].args._approved.should.be.true;
        });
      });

      describe('when the operator was set as not approved', function () {
        beforeEach(async function () {
          await token.setApprovalForAll(operator, false, { from: sender });
        });

        it('approves the operator', async function () {
          await token.setApprovalForAll(operator, true, { from: sender });

          const isApproved = await token.isApprovedForAll(sender, operator);
          isApproved.should.be.true;
        });

        it('emits an approval event', async function () {
          const { logs } = await token.setApprovalForAll(operator, true, { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('ApprovalForAll');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._operator.should.be.equal(operator);
          logs[0].args._approved.should.be.true;
        });

        it('can unset the operator approval', async function () {
          await token.setApprovalForAll(operator, false, { from: sender });

          const isApproved = await token.isApprovedForAll(sender, operator);
          isApproved.should.be.false;
        });
      });

      describe('when the operator was already approved', function () {
        beforeEach(async function () {
          await token.setApprovalForAll(operator, true, { from: sender });
        });

        it('keeps the approval to the given address and does not emit an approval event', async function () {
          await token.setApprovalForAll(operator, true, { from: sender });

          const isApproved = await token.isApprovedForAll(sender, operator);
          isApproved.should.be.true;
        });

        it('emits an approval event', async function () {
          const { logs } = await token.setApprovalForAll(operator, true, { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('ApprovalForAll');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._operator.should.be.equal(operator);
          logs[0].args._approved.should.be.true;
        });
      });
    });

    describe('when the operator is the owner', function () {
      const operator = _creator;

      it('reverts', async function () {
        await assertRevert(token.setApprovalForAll(operator, true, { from: sender }));
      });
    });
  });
});
