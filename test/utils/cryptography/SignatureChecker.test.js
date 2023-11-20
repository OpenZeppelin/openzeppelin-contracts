const { ethers } = require('hardhat');
const { expect } = require('chai');

const TEST_MESSAGE = ethers.id('OpenZeppelin');
const WRONG_MESSAGE = ethers.id('Nope');

describe('SignatureChecker (ERC1271)', function () {
  before('deploying', async function () {
    [this.signer, this.other] = await ethers.getSigners();
    this.signaturechecker = await ethers.deployContract('$SignatureChecker');
    this.wallet = await ethers.deployContract('ERC1271WalletMock', [this.signer]);
    this.malicious = await ethers.deployContract('ERC1271MaliciousMock');
    this.signature = await this.signer.signMessage(TEST_MESSAGE);
  });

  describe('EOA account', function () {
    it('with matching signer and signature', async function () {
      expect(
        await this.signaturechecker.$isValidSignatureNow(this.signer, ethers.hashMessage(TEST_MESSAGE), this.signature),
      ).to.equal(true);
    });

    it('with invalid signer', async function () {
      expect(
        await this.signaturechecker.$isValidSignatureNow(this.other, ethers.hashMessage(TEST_MESSAGE), this.signature),
      ).to.equal(false);
    });

    it('with invalid signature', async function () {
      expect(
        await this.signaturechecker.$isValidSignatureNow(
          this.signer,
          ethers.hashMessage(WRONG_MESSAGE),
          this.signature,
        ),
      ).to.equal(false);
    });
  });

  describe('ERC1271 wallet', function () {
    for (const signature of ['isValidERC1271SignatureNow', 'isValidSignatureNow']) {
      describe(signature, function () {
        it('with matching signer and signature', async function () {
          expect(
            await this.signaturechecker[`$${signature}`](this.wallet, ethers.hashMessage(TEST_MESSAGE), this.signature),
          ).to.equal(true);
        });

        it('with invalid signer', async function () {
          expect(
            await this.signaturechecker[`$${signature}`](
              this.signaturechecker,
              ethers.hashMessage(TEST_MESSAGE),
              this.signature,
            ),
          ).to.equal(false);
        });

        it('with invalid signature', async function () {
          expect(
            await this.signaturechecker[`$${signature}`](
              this.wallet,
              ethers.hashMessage(WRONG_MESSAGE),
              this.signature,
            ),
          ).to.equal(false);
        });

        it('with malicious wallet', async function () {
          expect(
            await this.signaturechecker[`$${signature}`](
              this.malicious,
              ethers.hashMessage(TEST_MESSAGE),
              this.signature,
            ),
          ).to.equal(false);
        });
      });
    }
  });
});
