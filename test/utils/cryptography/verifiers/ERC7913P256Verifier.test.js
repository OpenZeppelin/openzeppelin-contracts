import { network } from 'hardhat';
import { expect } from 'chai';
import { NonNativeSigner, P256SigningKey } from '../../../helpers/signers';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const MAGIC = '0x024ad318'; // IERC7913SignatureVerifier.verify.selector
const FAIL = '0xffffffff';

const signer = new NonNativeSigner(P256SigningKey.random());

async function fixture() {
  const verifier = await ethers.deployContract('ERC7913P256Verifier');
  const { qx, qy } = signer.signingKey.publicKey;
  const key = ethers.concat([qx, qy]); // 0x40 bytes
  const hash = ethers.hexlify(ethers.randomBytes(32));
  const { r, s } = signer.signingKey.sign(hash);
  const sig = ethers.concat([r, s]); // 0x40 bytes
  return { verifier, key, hash, sig };
}

describe('ERC7913P256Verifier', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('accepts a canonical 0x40-byte signature', async function () {
    expect(await this.verifier.verify(this.key, this.hash, this.sig)).to.equal(MAGIC);
  });

  it('accepts a 0x41-byte signature (optional trailing recovery byte)', async function () {
    expect(await this.verifier.verify(this.key, this.hash, ethers.concat([this.sig, '0x1b']))).to.equal(MAGIC);
  });

  it('rejects a signature with extra trailing bytes (non-canonical encoding)', async function () {
    // Before this fix, `signature.length >= 0x40` accepted any trailing bytes.
    // Only the first 0x40 bytes are read, so a signature could be re-encoded into
    // many distinct byte strings that all verify (signature malleability).
    expect(await this.verifier.verify(this.key, this.hash, ethers.concat([this.sig, '0x0000']))).to.equal(FAIL);
    expect(await this.verifier.verify(this.key, this.hash, ethers.concat([this.sig, ethers.randomBytes(32)]))).to.equal(
      FAIL,
    );
  });

  it('rejects a signature shorter than 0x40 bytes', async function () {
    expect(await this.verifier.verify(this.key, this.hash, ethers.dataSlice(this.sig, 0, 0x3f))).to.equal(FAIL);
  });
});
