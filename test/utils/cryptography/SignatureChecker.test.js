const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const precompile = require('../../helpers/precompiles');
const { NonNativeSigner, P256SigningKey, RSASHA256SigningKey } = require('../../helpers/signers');

const TEST_MESSAGE = ethers.id('OpenZeppelin');
const TEST_MESSAGE_HASH = ethers.hashMessage(TEST_MESSAGE);

const WRONG_MESSAGE = ethers.id('Nope');
const WRONG_MESSAGE_HASH = ethers.hashMessage(WRONG_MESSAGE);

async function fixture() {
  const mock = await ethers.deployContract('$SignatureChecker');
  return { mock };
}

async function fixtureECDSA() {
  const signer = ethers.Wallet.createRandom();
  const other = ethers.Wallet.createRandom();
  signer.erc7913id = ethers.concat([signer.address]);
  other.erc7913id = ethers.concat([other.address]);

  const signature = await signer.signMessage(TEST_MESSAGE);

  const wallet = await ethers.deployContract('ERC1271WalletMock', [signer]);
  const malicious = await ethers.deployContract('ERC1271MaliciousMock');

  return { signer, other, signature, wallet, malicious };
}

async function fixtureP256() {
  const verifier = await ethers.deployContract('ERC7913SignatureVerifierP256');

  const signer = new NonNativeSigner(P256SigningKey.random());
  const other = new NonNativeSigner(P256SigningKey.random());
  signer.erc7913id = ethers.concat([verifier.target, signer.signingKey.publicKey.qx, signer.signingKey.publicKey.qy]);
  other.erc7913id = ethers.concat([verifier.target, other.signingKey.publicKey.qx, other.signingKey.publicKey.qy]);

  const signature = await signer.signMessage(TEST_MESSAGE);

  return { signer, other, signature };
}

async function fixtureRSA() {
  const verifier = await ethers.deployContract('ERC7913SignatureVerifierRSA');

  const signer = new NonNativeSigner(RSASHA256SigningKey.random());
  const other = new NonNativeSigner(RSASHA256SigningKey.random());
  signer.erc7913id = ethers.concat([
    verifier.target,
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'bytes'],
      [signer.signingKey.publicKey.e, signer.signingKey.publicKey.n],
    ),
  ]);
  other.erc7913id = ethers.concat([
    verifier.target,
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'bytes'],
      [other.signingKey.publicKey.e, other.signingKey.publicKey.n],
    ),
  ]);

  const signature = await signer.signMessage(TEST_MESSAGE);

  return { signer, other, signature };
}

describe('SignatureChecker', function () {
  before('deploying', async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('EOA account', function () {
    before('deploying', async function () {
      Object.assign(this, await loadFixture(fixtureECDSA));
    });

    it('with matching signer and signature', async function () {
      await expect(
        this.mock.getFunction('$isValidSignatureNow(address,bytes32,bytes)')(
          this.signer,
          TEST_MESSAGE_HASH,
          this.signature,
        ),
      ).to.eventually.be.true;
    });

    it('with invalid signer', async function () {
      await expect(
        this.mock.getFunction('$isValidSignatureNow(address,bytes32,bytes)')(
          this.other,
          TEST_MESSAGE_HASH,
          this.signature,
        ),
      ).to.eventually.be.false;
    });

    it('with invalid signature', async function () {
      await expect(
        this.mock.getFunction('$isValidSignatureNow(address,bytes32,bytes)')(
          this.signer,
          WRONG_MESSAGE_HASH,
          this.signature,
        ),
      ).to.eventually.be.false;
    });
  });

  describe('ERC1271 wallet', function () {
    before('deploying', async function () {
      Object.assign(this, await loadFixture(fixtureECDSA));
    });

    for (const fn of [
      'isValidERC1271SignatureNow(address,bytes32,bytes)',
      'isValidSignatureNow(address,bytes32,bytes)',
    ]) {
      describe(fn, function () {
        it('with matching signer and signature', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.wallet, TEST_MESSAGE_HASH, this.signature)).to.eventually.be
            .true;
        });

        it('with invalid signer', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.mock, TEST_MESSAGE_HASH, this.signature)).to.eventually.be
            .false;
        });

        it('with identity precompile', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(precompile.identity, TEST_MESSAGE_HASH, this.signature)).to
            .eventually.be.false;
        });

        it('with invalid signature', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.wallet, WRONG_MESSAGE_HASH, this.signature)).to.eventually
            .be.false;
        });

        it('with malicious wallet', async function () {
          await expect(this.mock.getFunction(`$${fn}`)(this.malicious, TEST_MESSAGE_HASH, this.signature)).to.eventually
            .be.false;
        });
      });
    }
  });

  describe('ERC7913 verifier', function () {
    it('malicious verifier', async function () {
      const malicious = await ethers.deployContract('ERC7913MaliciousMock');
      await expect(
        this.mock.getFunction('$isValidSignatureNow(bytes,bytes32,bytes)')(malicious.target, TEST_MESSAGE_HASH, '0x'),
      ).to.eventually.be.false;
    });

    for (const { name, fix } of [
      { name: 'ECDSA', fix: fixtureECDSA },
      { name: 'P256', fix: fixtureP256 },
      { name: 'RSA', fix: fixtureRSA },
    ])
      describe(name, function () {
        before('deploying', async function () {
          Object.assign(this, await loadFixture(fix));
        });

        it('with matching signer and signature', async function () {
          await expect(
            this.mock.getFunction('$isValidSignatureNow(bytes,bytes32,bytes)')(
              this.signer.erc7913id,
              TEST_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.true;
        });

        it('with invalid signer', async function () {
          await expect(
            this.mock.getFunction('$isValidSignatureNow(bytes,bytes32,bytes)')(
              this.other.erc7913id,
              TEST_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.false;
        });

        it('with identity precompile', async function () {
          await expect(
            this.mock.getFunction('$isValidSignatureNow(bytes,bytes32,bytes)')(
              precompile.identity,
              TEST_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.false;
        });

        it('with invalid signature', async function () {
          await expect(
            this.mock.getFunction('$isValidSignatureNow(bytes,bytes32,bytes)')(
              this.other.erc7913id,
              WRONG_MESSAGE_HASH,
              this.signature,
            ),
          ).to.eventually.be.false;
        });
      });
  });
});
