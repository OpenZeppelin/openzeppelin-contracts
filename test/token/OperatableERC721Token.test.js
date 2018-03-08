import abi from 'ethereumjs-abi';
import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;
const SimpleToken = artifacts.require('SimpleToken.sol');
const OperatableERC721Token = artifacts.require('OperatableERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('OperatableERC721Token', accounts => {
  let token = null;
  const _name = 'Non Fungible Token';
  const _symbol = 'NFT';
  const _firstTokenId = 1;
  const _secondTokenId = 2;
  const _unknownTokenId = 3;
  const _creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    token = await OperatableERC721Token.new(_name, _symbol, { from: _creator });
    await token.publicMint(_creator, _firstTokenId, { from: _creator });
    await token.publicMint(_creator, _secondTokenId, { from: _creator });
  });

  describe('transfer and call', async function () {
    let data;
    let erc20; // we are using an erc20 token to test transfer and call

    beforeEach(async function () {
      erc20 = await SimpleToken.new({ from: _creator });
      const balance = web3.toHex(await erc20.balanceOf(_creator));
      await erc20.approve(token.address, balance);
      const args = ['address', 'address', 'uint256'];
      const methodId = '0x' + abi.methodID('transferFrom', args).toString('hex');
      const params = abi.rawEncode(args, [_creator, token.address, balance]).toString('hex');
      data = methodId + params;
    });

    describe('when the given token ID was tracked by this token', function () {
      const tokenId = _firstTokenId;

      describe('when the msg.sender is the owner of the given token ID', function () {
        const sender = _creator;

        describe('when the address to transfer the token to is not the zero address', function () {
          it('transfers the ownership of the given token ID to the given address', async function () {
            const to = erc20.address;
            await token.transferAndCall(to, tokenId, data, { from: sender });

            const newOwner = await token.ownerOf(tokenId);
            newOwner.should.be.equal(to);
          });

          it('clears the approval for the token ID', async function () {
            const to = erc20.address;
            await token.approve(accounts[2], tokenId, { from: sender });

            await token.transferAndCall(to, tokenId, data, { from: sender });

            const approvedAccount = await token.approvedFor(tokenId);
            approvedAccount.should.be.equal(ZERO_ADDRESS);
          });

          it('emits an approval and transfer events', async function () {
            const to = erc20.address;
            const { logs } = await token.transferAndCall(to, tokenId, data, { from: sender });

            logs.length.should.be.equal(3);

            logs[0].event.should.be.eq('Approval');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);

            logs[1].event.should.be.eq('Transfer');
            logs[1].args._from.should.be.equal(sender);
            logs[1].args._to.should.be.equal(to);
            logs[1].args._tokenId.should.be.bignumber.equal(tokenId);

            logs[2].event.should.be.eq('Transfer');
          });

          it('adjusts owners balances', async function () {
            const to = erc20.address;
            const previousBalance = await token.balanceOf(sender);
            await token.transferAndCall(to, tokenId, data, { from: sender });

            const newOwnerBalance = await token.balanceOf(to);
            newOwnerBalance.should.be.bignumber.equal(1);

            const previousOwnerBalance = await token.balanceOf(_creator);
            previousOwnerBalance.should.be.bignumber.equal(previousBalance - 1);
          });

          it('places the last token of the sender in the position of the transferred token', async function () {
            const to = erc20.address;
            const firstTokenIndex = 0;
            const lastTokenIndex = await token.balanceOf(_creator) - 1;
            const lastToken = await token.tokenOfOwnerByIndex(_creator, lastTokenIndex);

            await token.transferAndCall(to, tokenId, data, { from: sender });

            const swappedToken = await token.tokenOfOwnerByIndex(_creator, firstTokenIndex);
            swappedToken.should.be.bignumber.equal(lastToken);
            await assertRevert(token.tokenOfOwnerByIndex(_creator, lastTokenIndex));
          });

          it('adds the token to the tokens list of the new owner', async function () {
            const to = erc20.address;
            await token.transferAndCall(to, tokenId, data, { from: sender });

            const tokenIDs = await token.tokensOf(to);
            tokenIDs.length.should.be.equal(1);
            tokenIDs[0].should.be.bignumber.equal(tokenId);
          });

          it('calls the receiver with the given data', async function () {
            const to = erc20.address;
            const previousBalance = await erc20.balanceOf(_creator);
            await token.transferAndCall(to, tokenId, data, { from: sender });

            const contractBalance = await erc20.balanceOf(token.address);
            contractBalance.should.be.bignumber.equal(previousBalance);
          });
        });

        describe('when the address to transfer the token to is the zero address', function () {
          const to = ZERO_ADDRESS;

          it('reverts', async function () {
            await assertRevert(token.transferAndCall(to, 0, data, { from: _creator }));
          });
        });
      });

      describe('when the msg.sender is not the owner of the given token ID', function () {
        const sender = accounts[2];

        it('reverts', async function () {
          await assertRevert(token.transferAndCall(accounts[1], tokenId, data, { from: sender }));
        });
      });
    });

    describe('when the given token ID was not tracked by this token', function () {
      let tokenId = _unknownTokenId;

      it('reverts', async function () {
        await assertRevert(token.transferAndCall(accounts[1], tokenId, data, { from: _creator }));
      });
    });
  });

  describe('setOperatorApproval', function () {
    const sender = _creator;

    describe('when the operator willing to approve is not the owner', function () {
      const operator = accounts[1];

      describe('when there is no operator approval set by the sender', function () {
        it('approves the operator and does not emit an approval event', async function () {
          const { logs } = await token.setOperatorApproval(operator, true, { from: sender });

          const isApproved = await token.isOperatorApprovedFor(sender, operator);
          isApproved.should.be.true;
          logs.length.should.be.equal(0);
        });
      });

      describe('when the operator was set as not approved', function () {
        it('approves the operator and does not emit an approval event', async function () {
          const { logs } = await token.setOperatorApproval(operator, true, { from: sender });

          const isApproved = await token.isOperatorApprovedFor(sender, operator);
          isApproved.should.be.true;
          logs.length.should.be.equal(0);
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
          const { logs } = await token.setOperatorApproval(operator, true, { from: sender });

          const isApproved = await token.isOperatorApprovedFor(sender, operator);
          isApproved.should.be.true;
          logs.length.should.be.equal(0);
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
