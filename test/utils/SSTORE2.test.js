const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { generators } = require('../helpers/random');

const MAX_DATA_LENGTH = 0x5fff;

const creationCodeFor = data =>
  ethers.concat([
    '0x61',
    ethers.toBeHex((data.length - 2) / 2 + 1, 2), // runtime code size = data length + 1 (STOP prefix)
    '0x80600A3D393DF300',
    data,
  ]);

async function fixture() {
  const mock = await ethers.deployContract('$SSTORE2');
  return { mock };
}

describe('SSTORE2', function () {
  const salt = ethers.id('some salt');

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const [descr, data] of Object.entries({
    'empty data': '0x',
    'short data': generators.hexBytes(42),
    'long data': generators.hexBytes(1024),
  })) {
    describe(descr, function () {
      beforeEach(async function () {
        this.data = data;
        this.length = (data.length - 2) / 2;
      });

      describe('write', function () {
        it('stores the data prefixed with a STOP opcode and returns the pointer', async function () {
          const tx = await this.mock.$write(this.data);
          const [pointer] = await tx
            .wait()
            .then(receipt => this.mock.interface.decodeEventLog('return$write', receipt.logs[0].data));

          await expect(ethers.provider.getCode(pointer)).to.eventually.equal(ethers.concat(['0x00', this.data]));
        });
      });

      describe('writeDeterministic', function () {
        it('deploys the pointer at the predicted address', async function () {
          const predicted = await this.mock.$computeAddress(salt, this.data);

          await expect(this.mock.$writeDeterministic(this.data, salt))
            .to.emit(this.mock, 'return$writeDeterministic')
            .withArgs(predicted);

          await expect(ethers.provider.getCode(predicted)).to.eventually.equal(ethers.concat(['0x00', this.data]));
        });

        it('reverts when reusing the same salt and data', async function () {
          await this.mock.$writeDeterministic(this.data, salt);

          await expect(this.mock.$writeDeterministic(this.data, salt)).to.be.revertedWithCustomError(
            this.mock,
            'FailedDeployment',
          );
        });
      });

      describe('computeAddress', function () {
        it('matches the ethers CREATE2 address derivation', async function () {
          const expected = ethers.getCreate2Address(
            this.mock.target,
            salt,
            ethers.keccak256(creationCodeFor(this.data)),
          );

          await expect(this.mock.$computeAddress(salt, this.data)).to.eventually.equal(expected);
          await expect(
            this.mock.$computeAddress(salt, this.data, ethers.Typed.address(this.mock.target)),
          ).to.eventually.equal(expected);
        });
      });

      describe('initCodeHash', function () {
        it('matches the hash of the reference creation code', async function () {
          await expect(this.mock.$initCodeHash(this.data)).to.eventually.equal(
            ethers.keccak256(creationCodeFor(this.data)),
          );
        });
      });

      describe('read', function () {
        beforeEach(async function () {
          this.pointer = await this.mock.$write.staticCall(this.data);
          await this.mock.$write(this.data);
        });

        it('reads the full data', async function () {
          await expect(this.mock.$read(this.pointer)).to.eventually.equal(this.data);
        });

        it('reads a slice of the data', async function () {
          const start = Math.floor(this.length / 4);
          const end = Math.floor((this.length * 3) / 4);

          await expect(this.mock.$read(this.pointer, ethers.Typed.uint256(start))).to.eventually.equal(
            ethers.dataSlice(this.data, start),
          );
          await expect(
            this.mock.$read(this.pointer, ethers.Typed.uint256(start), ethers.Typed.uint256(end)),
          ).to.eventually.equal(ethers.dataSlice(this.data, start, end));
        });

        it('clamps out of bound slices', async function () {
          await expect(this.mock.$read(this.pointer, ethers.Typed.uint256(this.length + 1))).to.eventually.equal('0x');
          await expect(
            this.mock.$read(this.pointer, ethers.Typed.uint256(0), ethers.Typed.uint256(this.length + 42)),
          ).to.eventually.equal(this.data);
          await expect(
            this.mock.$read(
              this.pointer,
              ethers.Typed.uint256(this.length + 1),
              ethers.Typed.uint256(this.length + 42),
            ),
          ).to.eventually.equal('0x');
        });
      });
    });
  }

  it('reading an address with no code returns an empty buffer', async function () {
    await expect(this.mock.$read(generators.address())).to.eventually.equal('0x');
  });

  it('write reverts if data is too large', async function () {
    const data = ethers.hexlify(new Uint8Array(MAX_DATA_LENGTH + 1));

    await expect(this.mock.$write(data))
      .to.be.revertedWithCustomError(this.mock, 'SSTORE2DataTooLarge')
      .withArgs(MAX_DATA_LENGTH + 1);
  });

  it('writes and reads data of maximum length', async function () {
    const data = ethers.hexlify(ethers.randomBytes(MAX_DATA_LENGTH));

    const pointer = await this.mock.$write.staticCall(data);
    await this.mock.$write(data);

    await expect(this.mock.$read(pointer)).to.eventually.equal(data);
  });
});
