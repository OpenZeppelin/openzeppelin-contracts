const { ethers } = require('hardhat');
const { expect } = require('chai');
const { spawn } = require('child_process');

const hardhat = 'hardhat';
const anvil = 'anvil';
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
  MISMATCH_LEAF_PATH_KEY_REMAINDERS: 8,
  INVALID_PATH_REMAINDER: 9,
  INVALID_KEY_REMAINDER: 10,
  UNKNOWN_NODE_PREFIX: 11,
  UNPARSEABLE_NODE: 12,
  INVALID_PROOF: 13,
};

// Method eth_getProof is not supported with default Hardhat Network, so Anvil is used for that.
async function fixture(anvilProcess) {
  // Wait for Anvil to be ready
  await new Promise(resolve => {
    anvilProcess.stdout.once('data', resolve);
  });
  if (process.env.ANVIL_LOGS === 'true') {
    anvilProcess.stdout.on('data', function (data) {
      console.log(data.toString()); // optional logging
    });
  }
  const [provider, account, storage] = [{}, {}, {}];
  // Setup and deploy contracts on both Hardhat and Anvil networks.
  for (const providerType of [hardhat, anvil]) {
    provider[providerType] =
      providerType === anvil ? new ethers.JsonRpcProvider(`http://localhost:${anvilPort}`) : ethers.provider;
    account[providerType] = await provider[providerType].getSigner(0);
    storage[providerType] = (await ethers.deployContract('StorageSlotMock', account[providerType])).connect(
      account[providerType],
    );
  }
  const mock = (await ethers.deployContract('$TrieProof', account[hardhat])).connect(account[hardhat]); // only required on hardhat network
  const getProof = async function (contract, slot, tx) {
    const { storageHash, storageProof } = await this.provider[anvil].send('eth_getProof', [
      contract[anvil].target,
      [slot],
      tx ? ethers.toBeHex(tx[anvil].blockNumber) : 'latest',
    ]);
    const { key, value, proof } = storageProof[0];
    return { key, value, proof, storageHash };
  };

  return {
    anvilProcess,
    provider,
    account,
    storage,
    mock,
    getProof,
  };
}

describe('TrieProof', function () {
  beforeEach(async function () {
    this.anvilProcess = await startAnvil(); // assign as soon as possible to allow killing in case fixture fails
    Object.assign(this, await fixture(this.anvilProcess));
  });

  afterEach(async function () {
    if (this.anvilProcess) {
      this.anvilProcess.kill();
    }
  });

  describe('verify', function () {
    it('returns true for a valid proof with leaf', async function () {
      const slot = ethers.ZeroHash;
      const tx = await call(this.storage, 'setUint256Slot', [slot, 42]);
      const { key, value, proof, storageHash } = await this.getProof(this.storage, slot, tx);
      const result = await this.mock.$verify(ethers.keccak256(key), value, proof, storageHash);
      expect(result).is.true;
    });

    it('returns true for a valid proof with extension', async function () {
      const slot0 = ethers.ZeroHash;
      const slot1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      await call(this.storage, 'setUint256Slot', [slot0, 42]);
      const tx = await call(this.storage, 'setUint256Slot', [slot1, 43]);
      const { key, value, proof, storageHash } = await this.getProof(this.storage, slot1, tx);
      const result = await this.mock.$verify(ethers.keccak256(key), value, proof, storageHash);
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
      const tx = await call(this.storage, 'setUint256Slot', [slot, 42]);
      const { key, proof, storageHash } = await this.getProof(this.storage, slot, tx);
      const [processedValue, error] = await this.mock.$processProof(key, proof, ethers.keccak256(storageHash)); // Corrupt root hash
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_ROOT_HASH);
    });

    it('fails to process proof with invalid internal large hash', async function () {
      const slot0 = ethers.ZeroHash;
      const slot1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      await call(this.storage, 'setUint256Slot', [slot0, 42]);
      const tx = await call(this.storage, 'setUint256Slot', [slot1, 43]);
      const { key, proof, storageHash } = await this.getProof(this.storage, slot1, tx);
      proof[1] = ethers.toBeHex(BigInt(proof[1]) + 1n); // Corrupt internal large node hash
      const [processedValue, error] = await this.mock.$processProof(key, proof, storageHash);
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_LARGE_INTERNAL_HASH);
    });

    it.skip('fails to process proof with invalid internal short node', async function () {}); // TODO: INVALID_INTERNAL_NODE_HASH

    it('fails to process proof with empty value', async function () {
      const proof = [ethers.encodeRlp(['0x2000', '0x'])]; // Corrupt proof to yield empty value
      const [processedValue, error] = await this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]));
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.EMPTY_VALUE);
    });

    it('fails to process proof with invalid extra proof', async function () {
      const slot0 = ethers.ZeroHash;
      const tx = await call(this.storage, 'setUint256Slot', [slot0, 42]);
      const { key, proof, storageHash } = await this.getProof(this.storage, slot0, tx);
      proof[1] = ethers.encodeRlp([]); // extra proof element
      const [processedValue, error] = await this.mock.$processProof(ethers.keccak256(key), proof, storageHash);
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.INVALID_EXTRA_PROOF_ELEMENT);
    });

    it('fails to process proof with mismatched leaf path and key remainders', async function () {
      const slot = ethers.ZeroHash;
      const key = ethers.keccak256(slot);
      const value = '0x2a';
      const proof = [
        ethers.encodeRlp([
          '0x20' + ethers.toBeHex(BigInt(key) + 1n).replace('0x', ''), // corrupt end of leaf path
          value,
        ]),
      ];
      const [processedValue, error] = await this.mock.$processProof(key, proof, ethers.keccak256(proof[0]));
      expect(processedValue).to.equal('0x');
      expect(error).to.equal(ProofError.MISMATCH_LEAF_PATH_KEY_REMAINDERS);
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

/**
 * Start an Anvil process.
 * @returns Anvil process
 */
async function startAnvil() {
  return spawn('anvil', ['--port', anvilPort], {
    timeout: 30000,
  });
}

/**
 * Call a method on both Hardhat and Anvil networks.
 * @returns txs on both networks
 */
async function call(contract, method, args) {
  const hardhatTx = await contract[hardhat][method](...args);
  const anvilTx = await contract[anvil][method](...args);
  return {
    [hardhat]: hardhatTx,
    [anvil]: anvilTx,
  };
}
