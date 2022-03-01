const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { EIP712Domain } = require('../helpers/eip712');

const { BN, expectRevert, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MinimalForwarder = artifacts.require('MinimalForwarder');
const CallReceiverMock = artifacts.require('CallReceiverMock');
const ERC721Mock = artifacts.require('ERC721Mock');
const ERC1155Mock = artifacts.require('ERC1155Mock');

const name = 'MinimalForwarder';
const version = '0.0.1';

contract('MinimalForwarder', function (accounts) {
  beforeEach(async function () {
    this.forwarder = await MinimalForwarder.new();
    this.domain = {
      name,
      version,
      chainId: await web3.eth.getChainId(),
      verifyingContract: this.forwarder.address,
    };
    this.types = {
      EIP712Domain,
      ForwardRequest: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data', type: 'bytes' },
      ],
    };
  });

  context('with message', function () {
    beforeEach(async function () {
      this.wallet = Wallet.generate();
      this.sender = web3.utils.toChecksumAddress(this.wallet.getAddressString());
      this.req = {
        from: this.sender,
        to: constants.ZERO_ADDRESS,
        value: '0',
        gas: '100000',
        nonce: Number(await this.forwarder.getNonce(this.sender)),
        data: '0x',
      };
      this.sign = () => ethSigUtil.signTypedMessage(
        this.wallet.getPrivateKey(),
        {
          data: {
            types: this.types,
            domain: this.domain,
            primaryType: 'ForwardRequest',
            message: this.req,
          },
        },
      );
    });

    context('verify', function () {
      context('valid signature', function () {
        beforeEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from))
            .to.be.bignumber.equal(web3.utils.toBN(this.req.nonce));
        });

        it('success', async function () {
          expect(await this.forwarder.verify(this.req, this.sign())).to.be.equal(true);
        });

        afterEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from))
            .to.be.bignumber.equal(web3.utils.toBN(this.req.nonce));
        });
      });

      context('invalid signature', function () {
        it('tampered from', async function () {
          expect(await this.forwarder.verify({ ...this.req, from: accounts[0] }, this.sign()))
            .to.be.equal(false);
        });
        it('tampered to', async function () {
          expect(await this.forwarder.verify({ ...this.req, to: accounts[0] }, this.sign()))
            .to.be.equal(false);
        });
        it('tampered value', async function () {
          expect(await this.forwarder.verify({ ...this.req, value: web3.utils.toWei('1') }, this.sign()))
            .to.be.equal(false);
        });
        it('tampered nonce', async function () {
          expect(await this.forwarder.verify({ ...this.req, nonce: this.req.nonce + 1 }, this.sign()))
            .to.be.equal(false);
        });
        it('tampered data', async function () {
          expect(await this.forwarder.verify({ ...this.req, data: '0x1742' }, this.sign()))
            .to.be.equal(false);
        });
        it('tampered signature', async function () {
          const tamperedsign = web3.utils.hexToBytes(this.sign());
          tamperedsign[42] ^= 0xff;
          expect(await this.forwarder.verify(this.req, web3.utils.bytesToHex(tamperedsign)))
            .to.be.equal(false);
        });
      });
    });

    context('execute', function () {
      context('valid signature', function () {
        beforeEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from))
            .to.be.bignumber.equal(web3.utils.toBN(this.req.nonce));
        });

        it('success', async function () {
          await this.forwarder.execute(this.req, this.sign()); // expect to not revert
        });

        afterEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from))
            .to.be.bignumber.equal(web3.utils.toBN(this.req.nonce + 1));
        });
      });

      context('invalid signature', function () {
        it('tampered from', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, from: accounts[0] }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered to', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, to: accounts[0] }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered value', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, value: web3.utils.toWei('1') }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered nonce', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, nonce: this.req.nonce + 1 }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered data', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, data: '0x1742' }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered signature', async function () {
          const tamperedsign = web3.utils.hexToBytes(this.sign());
          tamperedsign[42] ^= 0xff;
          await expectRevert(
            this.forwarder.execute(this.req, web3.utils.bytesToHex(tamperedsign)),
            'MinimalForwarder: signature does not match request',
          );
        });
      });

      it('bubble out of gas', async function () {
        const receiver = await CallReceiverMock.new();
        const gasAvailable = 100000;
        this.req.to = receiver.address;
        this.req.data = receiver.contract.methods.mockFunctionOutOfGas().encodeABI();
        this.req.gas = 1000000;

        await expectRevert.assertion(
          this.forwarder.execute(this.req, this.sign(), { gas: gasAvailable }),
        );

        const { transactions } = await web3.eth.getBlock('latest');
        const { gasUsed } = await web3.eth.getTransactionReceipt(transactions[0]);

        expect(gasUsed).to.be.equal(gasAvailable);
      });
    });
  });

  describe('onERC721Received', function () {
    const owner = accounts[0];
    const name = 'Non Fungible Token';
    const symbol = 'NFT';

    it('receives an ERC721 token', async function () {
      const token = await ERC721Mock.new(name, symbol);
      const tokenId = new BN(1);
      await token.mint(owner, tokenId);

      await token.safeTransferFrom(owner, this.forwarder.address, tokenId, { from: owner });

      expect(await token.ownerOf(tokenId)).to.be.equal(this.forwarder.address);
    });
  });

  describe('onERC1155Received', function () {
    const owner = accounts[0];
    const uri = 'https://token-cdn-domain/{id}.json';
    const multiTokenIds = [new BN(1), new BN(2), new BN(3)];
    const multiTokenAmounts = [new BN(1000), new BN(2000), new BN(3000)];
    const transferData = '0x12345678';

    beforeEach(async function () {
      this.multiToken = await ERC1155Mock.new(uri, { from: owner });
      await this.multiToken.mintBatch(owner, multiTokenIds, multiTokenAmounts, '0x', { from: owner });
    });

    it('receives ERC1155 tokens from a single ID', async function () {
      await this.multiToken.safeTransferFrom(
        owner,
        this.forwarder.address,
        multiTokenIds[0],
        multiTokenAmounts[0],
        transferData,
        { from: owner },
      );

      expect(await this.multiToken.balanceOf(this.forwarder.address, multiTokenIds[0])).to.be.bignumber.equal(
        multiTokenAmounts[0],
      );

      for (let i = 1; i < multiTokenIds.length; i++) {
        expect(await this.multiToken.balanceOf(this.forwarder.address, multiTokenIds[i])).to.be.bignumber.equal(
          new BN(0),
        );
      }
    });

    it('receives ERC1155 tokens from a multiple IDs', async function () {
      for (let i = 0; i < multiTokenIds.length; i++) {
        expect(await this.multiToken.balanceOf(this.forwarder.address, multiTokenIds[i])).to.be.bignumber.equal(
          new BN(0),
        );
      }

      await this.multiToken.safeBatchTransferFrom(
        owner,
        this.forwarder.address,
        multiTokenIds,
        multiTokenAmounts,
        transferData,
        { from: owner },
      );

      for (let i = 0; i < multiTokenIds.length; i++) {
        expect(await this.multiToken.balanceOf(this.forwarder.address, multiTokenIds[i])).to.be.bignumber.equal(
          multiTokenAmounts[i],
        );
      }
    });
  });
});
