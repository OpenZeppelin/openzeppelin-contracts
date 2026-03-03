const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { MAX_UINT32, MAX_UINT64 } = require('../../helpers/constants');

async function fixture() {
  const [user, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$AuthorityUtils');
  const notAuthorityMock = await ethers.deployContract('NotAuthorityMock');
  const authorityNoDelayMock = await ethers.deployContract('AuthorityNoDelayMock');
  const authorityDelayMock = await ethers.deployContract('AuthorityDelayMock');
  const authorityNoResponse = await ethers.deployContract('AuthorityNoResponse');

  return {
    user,
    other,
    mock,
    notAuthorityMock,
    authorityNoDelayMock,
    authorityDelayMock,
    authorityNoResponse,
  };
}

describe('AuthorityUtils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('canCallWithDelay', function () {
    describe('when authority does not have a canCall function', function () {
      beforeEach(async function () {
        this.authority = this.notAuthorityMock;
      });

      it('returns (immediate = 0, delay = 0)', async function () {
        const { immediate, delay } = await this.mock.$canCallWithDelay(
          this.authority,
          this.user,
          this.other,
          '0x12345678',
        );
        expect(immediate).to.be.false;
        expect(delay).to.equal(0n);
      });
    });

    describe('when authority has no delay', function () {
      beforeEach(async function () {
        this.authority = this.authorityNoDelayMock;
        this.immediate = true;
        await this.authority._setImmediate(this.immediate);
      });

      it('returns (immediate, delay = 0)', async function () {
        const { immediate, delay } = await this.mock.$canCallWithDelay(
          this.authority,
          this.user,
          this.other,
          '0x12345678',
        );
        expect(immediate).to.equal(this.immediate);
        expect(delay).to.equal(0n);
      });
    });

    describe('when authority replies with a delay', function () {
      beforeEach(async function () {
        this.authority = this.authorityDelayMock;
      });

      for (const immediate of [true, false]) {
        for (const delay of [0n, 42n, MAX_UINT32]) {
          it(`returns (immediate=${immediate}, delay=${delay})`, async function () {
            await this.authority._setImmediate(immediate);
            await this.authority._setDelay(delay);
            const result = await this.mock.$canCallWithDelay(this.authority, this.user, this.other, '0x12345678');
            expect(result.immediate).to.equal(immediate);
            expect(result.delay).to.equal(delay);
          });
        }
      }

      it('out of bound delay', async function () {
        await this.authority._setImmediate(false);
        await this.authority._setDelay(MAX_UINT64); // bigger than the expected uint32
        const result = await this.mock.$canCallWithDelay(this.authority, this.user, this.other, '0x12345678');
        expect(result.immediate).to.equal(false);
        expect(result.delay).to.equal(0n);
      });
    });

    describe('when authority replies with empty data', function () {
      beforeEach(async function () {
        this.authority = this.authorityNoResponse;
      });

      it('returns (immediate = 0, delay = 0)', async function () {
        const { immediate, delay } = await this.mock.$canCallWithDelay(
          this.authority,
          this.user,
          this.other,
          '0x12345678',
        );
        expect(immediate).to.be.false;
        expect(delay).to.equal(0n);
      });
    });
  });
});
