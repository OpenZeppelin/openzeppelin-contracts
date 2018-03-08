import assertRevert from '../../helpers/assertRevert';
const BigNumber = web3.BigNumber;
const ERC721Token = artifacts.require('ERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Token', accounts => {
  let token = null;
  const _name = 'Non Fungible Token';
  const _symbol = 'NFT';
  const _firstTokenId = 1;
  const _secondTokenId = 2;
  const _unknownTokenId = 3;
  const _creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    token = await ERC721Token.new(_name, _symbol, { from: _creator });
    await token.mint(_creator, _firstTokenId, { from: _creator });
    await token.mint(_creator, _secondTokenId, { from: _creator });
  });

  describe('name', function () {
    it('has a name', async function () {
      const name = await token.name();
      name.should.be.equal(_name);
    });
  });

  describe('symbol', function () {
    it('has a symbol', async function () {
      const symbol = await token.symbol();
      symbol.should.be.equal(_symbol);
    });
  });

  describe('tokenOfOwnerByIndex', function () {
    describe('when the given address owns some tokens', function () {
      const owner = _creator;

      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        const index = 0;

        it('returns the token ID placed at the given index', async function () {
          const tokenId = await token.tokenOfOwnerByIndex(owner, index);
          tokenId.should.be.bignumber.equal(_firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        const index = 2;

        it('reverts', async function () {
          await assertRevert(token.tokenOfOwnerByIndex(owner, index));
        });
      });
    });

    describe('when the given address does not own any token', function () {
      const owner = accounts[1];

      it('reverts', async function () {
        await assertRevert(token.tokenOfOwnerByIndex(owner, 0));
      });
    });
  });

  describe('setOperatorApproval', function () {
    const sender = _creator;

    describe('when the operator willing to approve is not the owner', function () {
      const operator = accounts[1];

      describe('when there is no operator approval set by the sender', function () {
        it('approves the operator', async function () {
          await token.setOperatorApproval(operator, true, { from: sender });

          const isApproved = await token.isOperatorApprovedFor(sender, operator);
          isApproved.should.be.true;
        });

        it('emits an approval event', async function () {
          const { logs } = await token.setOperatorApproval(operator, true, { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('OperatorApproval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._operator.should.be.equal(operator);
          logs[0].args._approved.should.be.true;
        });
      });

      describe('when the operator was set as not approved', function () {
        beforeEach(async function () {
          await token.setOperatorApproval(operator, false, { from: sender });
        });

        it('approves the operator', async function () {
          await token.setOperatorApproval(operator, true, { from: sender });

          const isApproved = await token.isOperatorApprovedFor(sender, operator);
          isApproved.should.be.true;
        });

        it('emits an approval event', async function () {
          const { logs } = await token.setOperatorApproval(operator, true, { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('OperatorApproval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._operator.should.be.equal(operator);
          logs[0].args._approved.should.be.true;
        });

        it('can unset the operator approval', async function () {
          await token.setOperatorApproval(operator, false, { from: sender });

          const isApproved = await token.isOperatorApprovedFor(sender, operator);
          isApproved.should.be.false;
        });
      });

      describe('when the operator was already approved', function () {
        beforeEach(async function () {
          await token.setOperatorApproval(operator, true, { from: sender });
        });

        it('keeps the approval to the given address and does not emit an approval event', async function () {
          await token.setOperatorApproval(operator, true, { from: sender });

          const isApproved = await token.isOperatorApprovedFor(sender, operator);
          isApproved.should.be.true;
        });

        it('emits an approval event', async function () {
          const { logs } = await token.setOperatorApproval(operator, true, { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('OperatorApproval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._operator.should.be.equal(operator);
          logs[0].args._approved.should.be.true;
        });
      });
    });

    describe('when the operator is the owner', function () {
      const operator = _creator;

      it('reverts', async function () {
        await assertRevert(token.setOperatorApproval(operator, true, { from: sender }));
      });
    });
  });

  describe('takeOwnership', function () {
    const tokenId = _firstTokenId;

    describe('when the sender was approved by the owner of the token ID', function () {
      const sender = accounts[1];

      beforeEach(async function () {
        await token.setOperatorApproval(sender, true, { from: _creator });
      });

      it('transfers the ownership of the given token ID to the given address', async function () {
        await token.takeOwnership(tokenId, { from: sender });

        const newOwner = await token.ownerOf(tokenId);
        newOwner.should.be.equal(sender);
      });

      it('clears the approval for the token ID', async function () {
        await token.takeOwnership(tokenId, { from: sender });

        const approvedAccount = await token.approvedFor(tokenId);
        approvedAccount.should.be.equal(ZERO_ADDRESS);
      });

      it('emits an approval and transfer events', async function () {
        const { logs } = await token.takeOwnership(tokenId, { from: sender });

        logs.length.should.be.equal(2);

        logs[0].event.should.be.eq('Approval');
        logs[0].args._owner.should.be.equal(_creator);
        logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
        logs[0].args._tokenId.should.be.bignumber.equal(tokenId);

        logs[1].event.should.be.eq('Transfer');
        logs[1].args._from.should.be.equal(_creator);
        logs[1].args._to.should.be.equal(sender);
        logs[1].args._tokenId.should.be.bignumber.equal(tokenId);
      });

      it('adjusts owners balances', async function () {
        const previousBalance = await token.balanceOf(_creator);

        await token.takeOwnership(tokenId, { from: sender });

        const newOwnerBalance = await token.balanceOf(sender);
        newOwnerBalance.should.be.bignumber.equal(1);

        const previousOwnerBalance = await token.balanceOf(_creator);
        previousOwnerBalance.should.be.bignumber.equal(previousBalance - 1);
      });

      it('places the last token of the sender in the position of the transferred token', async function () {
        const firstTokenIndex = 0;
        const lastTokenIndex = await token.balanceOf(_creator) - 1;
        const lastToken = await token.tokenOfOwnerByIndex(_creator, lastTokenIndex);

        await token.takeOwnership(tokenId, { from: sender });

        const swappedToken = await token.tokenOfOwnerByIndex(_creator, firstTokenIndex);
        swappedToken.should.be.bignumber.equal(lastToken);
        await assertRevert(token.tokenOfOwnerByIndex(_creator, lastTokenIndex));
      });

      it('adds the token to the tokens list of the new owner', async function () {
        await token.takeOwnership(tokenId, { from: sender });

        const tokenIDs = await token.tokensOf(sender);
        tokenIDs.length.should.be.equal(1);
        tokenIDs[0].should.be.bignumber.equal(tokenId);
      });
    });
  });

  describe('takeOwnershipFor', function () {
    describe('when the given token ID was already tracked by this contract', function () {
      const tokenId = _firstTokenId;

      describe('when the sender has the approval for the token ID', function () {
        const sender = accounts[1];

        beforeEach(async function () {
          await token.approve(sender, tokenId, { from: _creator });
        });

        describe('when the recipient is the zero address', function () {
          const to = ZERO_ADDRESS;

          it('reverts', async function () {
            await assertRevert(token.takeOwnershipFor(to, tokenId, { from: sender }));
          });
        });

        describe('when the recipient is the owner', function () {
          const to = _creator;

          it('reverts', async function () {
            await assertRevert(token.takeOwnershipFor(to, tokenId, { from: sender }));
          });
        });

        describe('when the recipient is not the zero address neither the owner', function () {
          const to = accounts[2];

          it('transfers the ownership of the given token ID to the given address', async function () {
            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const newOwner = await token.ownerOf(tokenId);
            newOwner.should.be.equal(to);
          });

          it('clears the approval for the token ID', async function () {
            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const approvedAccount = await token.approvedFor(tokenId);
            approvedAccount.should.be.equal(ZERO_ADDRESS);
          });

          it('emits an approval and transfer events', async function () {
            const { logs } = await token.takeOwnershipFor(to, tokenId, { from: sender });

            logs.length.should.be.equal(2);

            logs[0].event.should.be.eq('Approval');
            logs[0].args._owner.should.be.equal(_creator);
            logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);

            logs[1].event.should.be.eq('Transfer');
            logs[1].args._from.should.be.equal(_creator);
            logs[1].args._to.should.be.equal(to);
            logs[1].args._tokenId.should.be.bignumber.equal(tokenId);
          });

          it('adjusts owners balances', async function () {
            const previousBalance = await token.balanceOf(_creator);

            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const newOwnerBalance = await token.balanceOf(to);
            newOwnerBalance.should.be.bignumber.equal(1);

            const previousOwnerBalance = await token.balanceOf(_creator);
            previousOwnerBalance.should.be.bignumber.equal(previousBalance - 1);
          });

          it('places the last token of the sender in the position of the transferred token', async function () {
            const firstTokenIndex = 0;
            const lastTokenIndex = await token.balanceOf(_creator) - 1;
            const lastToken = await token.tokenOfOwnerByIndex(_creator, lastTokenIndex);

            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const swappedToken = await token.tokenOfOwnerByIndex(_creator, firstTokenIndex);
            swappedToken.should.be.bignumber.equal(lastToken);
            await assertRevert(token.tokenOfOwnerByIndex(_creator, lastTokenIndex));
          });

          it('adds the token to the tokens list of the new owner', async function () {
            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const tokenIDs = await token.tokensOf(to);
            tokenIDs.length.should.be.equal(1);
            tokenIDs[0].should.be.bignumber.equal(tokenId);
          });
        });
      });

      describe('when the sender was approved by the owner of the token ID', function () {
        const sender = accounts[1];

        beforeEach(async function () {
          await token.setOperatorApproval(sender, true, { from: _creator });
        });

        describe('when the recipient is the zero address', function () {
          const to = ZERO_ADDRESS;

          it('reverts', async function () {
            await assertRevert(token.takeOwnershipFor(to, tokenId, { from: sender }));
          });
        });

        describe('when the recipient is the owner', function () {
          const to = _creator;

          it('reverts', async function () {
            await assertRevert(token.takeOwnershipFor(to, tokenId, { from: sender }));
          });
        });

        describe('when the recipient is not the zero address neither the owner', function () {
          const to = accounts[2];

          it('transfers the ownership of the given token ID to the given address', async function () {
            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const newOwner = await token.ownerOf(tokenId);
            newOwner.should.be.equal(to);
          });

          it('clears the approval for the token ID', async function () {
            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const approvedAccount = await token.approvedFor(tokenId);
            approvedAccount.should.be.equal(ZERO_ADDRESS);
          });

          it('emits an approval and transfer events', async function () {
            const { logs } = await token.takeOwnershipFor(to, tokenId, { from: sender });

            logs.length.should.be.equal(2);

            logs[0].event.should.be.eq('Approval');
            logs[0].args._owner.should.be.equal(_creator);
            logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);

            logs[1].event.should.be.eq('Transfer');
            logs[1].args._from.should.be.equal(_creator);
            logs[1].args._to.should.be.equal(to);
            logs[1].args._tokenId.should.be.bignumber.equal(tokenId);
          });

          it('adjusts owners balances', async function () {
            const previousBalance = await token.balanceOf(_creator);

            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const newOwnerBalance = await token.balanceOf(to);
            newOwnerBalance.should.be.bignumber.equal(1);

            const previousOwnerBalance = await token.balanceOf(_creator);
            previousOwnerBalance.should.be.bignumber.equal(previousBalance - 1);
          });

          it('places the last token of the sender in the position of the transferred token', async function () {
            const firstTokenIndex = 0;
            const lastTokenIndex = await token.balanceOf(_creator) - 1;
            const lastToken = await token.tokenOfOwnerByIndex(_creator, lastTokenIndex);

            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const swappedToken = await token.tokenOfOwnerByIndex(_creator, firstTokenIndex);
            swappedToken.should.be.bignumber.equal(lastToken);
            await assertRevert(token.tokenOfOwnerByIndex(_creator, lastTokenIndex));
          });

          it('adds the token to the tokens list of the new owner', async function () {
            await token.takeOwnershipFor(to, tokenId, { from: sender });

            const tokenIDs = await token.tokensOf(to);
            tokenIDs.length.should.be.equal(1);
            tokenIDs[0].should.be.bignumber.equal(tokenId);
          });
        });
      });

      describe('when the sender does not have an approval for the token ID', function () {
        const sender = accounts[1];

        it('reverts', async function () {
          await assertRevert(token.takeOwnershipFor(accounts[2], tokenId, { from: sender }));
        });
      });

      describe('when the sender is already the owner of the token', function () {
        const sender = _creator;

        it('reverts', async function () {
          await assertRevert(token.takeOwnershipFor(accounts[2], tokenId, { from: sender }));
        });
      });
    });

    describe('when the given token ID was not tracked by the contract before', function () {
      const tokenId = _unknownTokenId;

      it('reverts', async function () {
        await assertRevert(token.takeOwnershipFor(accounts[2], tokenId, { from: _creator }));
      });
    });
  });
});
