const { ethers } = require('hardhat');
const { expect } = require('chai');
const { spawn } = require('child_process');

const anvilPort = 8546;
const ProofError = {
  NO_ERROR: 0,
  EMPTY_KEY: 1,
  INDEX_OUT_OF_BOUNDS: 2,
  INVALID_ROOT_HASH: 3,
  INVALID_LARGE_INTERNAL_HASH: 4,
  INVALID_INTERNAL_NODE_HASH: 5,
  EMPTY_VALUE: 6,
  INVALID_EXTRA_PROOF_ELEMENT: 7,
  INVALID_PATH_REMAINDER: 8,
  INVALID_KEY_REMAINDER: 9,
  UNKNOWN_NODE_PREFIX: 10,
  UNPARSEABLE_NODE: 11,
  INVALID_PROOF: 12,
};

async function fixture() {
  const anvil = spawn('anvil', ['--port', anvilPort], {
    timeout: 30000,
  }); // Method eth_getProof is not supported with default Hardhat Network
  await new Promise(resolve => {
    anvil.stdout.once('data', resolve);
  });
  if (process.env.ANVIL_LOGS === 'true') {
    anvil.stdout.on('data', function (data) {
      console.log(data.toString());
    });
  }
  const provider = new ethers.JsonRpcProvider(`http://localhost:${anvilPort}`);
  const account = await provider.getSigner(0);
  const mock = (await ethers.deployContract('$TrieProof', account)).connect(account);
  const storage = (await ethers.deployContract('StorageSlotMock', account)).connect(account);
  return {
    anvil,
    provider,
    mock,
    storage,
  };
}

describe('TrieProof', function () {
  beforeEach(async function () {
    Object.assign(this, await fixture());
  });

  afterEach(async function () {
    this.anvil.kill();
  });

  describe('verify', function () {
    it('returns true for a valid proof with leaf', async function () {
      const slot = ethers.ZeroHash;
      const tx = await this.storage.setUint256Slot(slot, 42);
      const response = await this.provider.send('eth_getProof', [
        this.storage.target,
        [slot],
        ethers.toBeHex(tx.blockNumber),
      ]);
      const { storageHash, storageProof } = response;
      const { key, value, proof } = storageProof[0];
      const result = await this.mock.$verify(key, value, proof, storageHash);
      expect(result).is.true;
    });

    it('returns true for a valid proof with extension', async function () {
      const slot0 = ethers.ZeroHash;
      const slot1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      await this.storage.setUint256Slot(slot0, 42);
      const tx = await this.storage.setUint256Slot(slot1, 43);
      const response = await this.provider.send('eth_getProof', [
        this.storage.target,
        [slot1],
        ethers.toBeHex(tx.blockNumber),
      ]);
      const { storageHash, storageProof } = response;
      const { key, value, proof } = storageProof[0];
      const result = await this.mock.$verify(key, value, proof, storageHash);
      expect(result).is.true;
    });

    it('fails to process proof with empty key', async function () {
      const [value, error] = await this.mock.$processProof('0x', [], ethers.ZeroHash);
      expect(value).to.equal('0x');
      expect(error).to.equal(ProofError.EMPTY_KEY);
    });

    it.skip('fails to process proof with key index out of bounds', async function () {}); // TODO: INDEX_OUT_OF_BOUNDS

    it('fails to process proof with invalid root hash', async function () {
      const slot = ethers.ZeroHash;
      const tx = await this.storage.setUint256Slot(slot, 42);
      const { storageHash, storageProof } = await this.provider.send('eth_getProof', [
        this.storage.target,
        [slot],
        ethers.toBeHex(tx.blockNumber),
      ]);
      const { key, proof } = storageProof[0];
      const [processedValue, error] = await this.mock.$processProof(key, proof, ethers.keccak256(storageHash)); // Corrupt root hash
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_ROOT_HASH);
    });

    it('fails to process proof with invalid internal large hash', async function () {
      const slot0 = ethers.ZeroHash;
      const slot1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      await this.storage.setUint256Slot(slot0, 42);
      const tx = await this.storage.setUint256Slot(slot1, 43);
      const { storageHash, storageProof } = await this.provider.send('eth_getProof', [
        this.storage.target,
        [slot1],
        ethers.toBeHex(tx.blockNumber),
      ]);
      const { key, proof } = storageProof[0];
      proof[1] = ethers.toBeHex(BigInt(proof[1]) + 1n); // Corrupt internal large node hash
      const [processedValue, error] = await this.mock.$processProof(key, proof, storageHash);
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_LARGE_INTERNAL_HASH);
    });

    it.skip('fails to process proof with invalid internal short node', async function () {}); // TODO: INVALID_INTERNAL_NODE_HASH

    it('fails to process proof with empty value', async function () {
      const proof = [ethers.encodeRlp(['0x20', '0x'])]; // Corrupt proof to yield empty value
      const [processedValue, error] = await this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]));
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.EMPTY_VALUE);
    });

    it('fails to process proof with invalid extra proof', async function () {
      const slot0 = ethers.ZeroHash;
      const tx = await this.storage.setUint256Slot(slot0, 42);
      const { storageHash, storageProof } = await this.provider.send('eth_getProof', [
        this.storage.target,
        [slot0],
        ethers.toBeHex(tx.blockNumber),
      ]);
      const { key, proof } = storageProof[0];
      proof[1] = ethers.encodeRlp([]); // extra proof element
      const [processedValue, error] = await this.mock.$processProof(key, proof, storageHash);
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_EXTRA_PROOF_ELEMENT);
    });

    it('fails to process proof with invalid path remainder', async function () {
      const proof = [ethers.encodeRlp(['0x0011', '0x'])]; // Corrupt proof to yield invalid path remainder
      const [processedValue, error] = await this.mock.$processProof(ethers.ZeroHash, proof, ethers.keccak256(proof[0]));
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_PATH_REMAINDER);
    });

    it.skip('fails to process proof with invalid key remainder', async function () {}); // TODO: INVALID_KEY_REMAINDER

    it('fails to process proof with unknown node prefix', async function () {
      const proof = [ethers.encodeRlp(['0x40', '0x'])];
      const [processedValue, error] = await this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]));
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.UNKNOWN_NODE_PREFIX);
    });

    it('fails to process proof with unparsable node', async function () {
      const proof = [ethers.encodeRlp(['0x00', '0x00', '0x00'])];
      const [processedValue, error] = await this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]));
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.UNPARSEABLE_NODE);
    });

    it('fails to process proof with invalid proof', async function () {
      const [processedValue, error] = await this.mock.$processProof('0x00', [], ethers.ZeroHash);
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_PROOF);
    });
  });
});
