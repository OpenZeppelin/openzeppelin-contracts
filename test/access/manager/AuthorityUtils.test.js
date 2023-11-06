require('@openzeppelin/test-helpers');

const AuthorityUtils = artifacts.require('$AuthorityUtils');
const NotAuthorityMock = artifacts.require('NotAuthorityMock');
const AuthorityNoDelayMock = artifacts.require('AuthorityNoDelayMock');
const AuthorityDelayMock = artifacts.require('AuthorityDelayMock');
const AuthorityNoResponse = artifacts.require('AuthorityNoResponse');

contract('AuthorityUtils', function (accounts) {
  const [user, other] = accounts;

  beforeEach(async function () {
    this.mock = await AuthorityUtils.new();
  });

  describe('canCallWithDelay', function () {
    describe('when authority does not have a canCall function', function () {
      beforeEach(async function () {
        this.authority = await NotAuthorityMock.new();
      });

      it('returns (immediate = 0, delay = 0)', async function () {
        const { immediate, delay } = await this.mock.$canCallWithDelay(
          this.authority.address,
          user,
          other,
          '0x12345678',
        );
        expect(immediate).to.equal(false);
        expect(delay).to.be.bignumber.equal('0');
      });
    });

    describe('when authority has no delay', function () {
      beforeEach(async function () {
        this.authority = await AuthorityNoDelayMock.new();
        this.immediate = true;
        await this.authority._setImmediate(this.immediate);
      });

      it('returns (immediate, delay = 0)', async function () {
        const { immediate, delay } = await this.mock.$canCallWithDelay(
          this.authority.address,
          user,
          other,
          '0x12345678',
        );
        expect(immediate).to.equal(this.immediate);
        expect(delay).to.be.bignumber.equal('0');
      });
    });

    describe('when authority replies with a delay', function () {
      beforeEach(async function () {
        this.authority = await AuthorityDelayMock.new();
      });

      for (const immediate of [true, false]) {
        for (const delay of ['0', '42']) {
          it(`returns (immediate=${immediate}, delay=${delay})`, async function () {
            await this.authority._setImmediate(immediate);
            await this.authority._setDelay(delay);
            const result = await this.mock.$canCallWithDelay(this.authority.address, user, other, '0x12345678');
            expect(result.immediate).to.equal(immediate);
            expect(result.delay).to.be.bignumber.equal(delay);
          });
        }
      }
    });

    describe('when authority replies with empty data', function () {
      beforeEach(async function () {
        this.authority = await AuthorityNoResponse.new();
      });

      it('returns (immediate = 0, delay = 0)', async function () {
        const { immediate, delay } = await this.mock.$canCallWithDelay(
          this.authority.address,
          user,
          other,
          '0x12345678',
        );
        expect(immediate).to.equal(false);
        expect(delay).to.be.bignumber.equal('0');
      });
    });
  });
});
