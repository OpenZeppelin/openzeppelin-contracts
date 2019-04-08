const RoundedDivMathMock = artifacts.require('RoundedDivMathMock');

contract('RoundedDivMath', function () {
  beforeEach(async function () {
    this.math = await RoundedDivMathMock.new();
  });

  describe('roundedDiv', function () {
    it('should return correct results', async function () {
      assert.equal(await this.math.roundedDiv(49, 100), 0);
      assert.equal(await this.math.roundedDiv(50, 100), 1);
      assert.equal(await this.math.roundedDiv(51, 100), 1);

      assert.equal(await this.math.roundedDiv(149, 100), 1);
      assert.equal(await this.math.roundedDiv(150, 100), 2);
      assert.equal(await this.math.roundedDiv(151, 100), 2);

      assert.equal(await this.math.roundedDiv(249, 100), 2);
      assert.equal(await this.math.roundedDiv(250, 100), 2);
      assert.equal(await this.math.roundedDiv(251, 100), 3);

      // divide by odd number
      assert.equal(await this.math.bankersRoundedDiv(49, 101), 0);
    });

    it('should throw if divided by null', async function () {
      await this.math.roundedDiv(49, 0).should.be.rejectedWith('revert');
    });
  });

  describe('bankersRoundedDiv', function () {
    it('should return correct results', async function () {
      assert.equal(await this.math.bankersRoundedDiv(49, 100), 0);
      assert.equal(await this.math.bankersRoundedDiv(50, 100), 0);
      assert.equal(await this.math.bankersRoundedDiv(51, 100), 1);

      assert.equal(await this.math.bankersRoundedDiv(149, 100), 1);
      assert.equal(await this.math.bankersRoundedDiv(150, 100), 2);
      assert.equal(await this.math.bankersRoundedDiv(151, 100), 2);

      assert.equal(await this.math.bankersRoundedDiv(249, 100), 2);
      assert.equal(await this.math.bankersRoundedDiv(250, 100), 2);
      assert.equal(await this.math.bankersRoundedDiv(251, 100), 3);

      // divide by odd number
      assert.equal(await this.math.bankersRoundedDiv(49, 101), 0);
    });

    it('should throw if divided by null', async function () {
      await this.math.roundedDiv(49, 0).should.be.rejectedWith('revert');
    });
  });

  describe('unitsToCentsRounded (roundedDiv)', function () {
    it('should return correct results', async function () {
      // 0.49 cents -> 0 cents
      // 0.5 cents -> 0 cents
      // 0.51 cents -> 1 cents
      // 1.49 cents -> 1 cents
      // 1.5 cents -> 1 cents
      // 1.51 cents -> 2 cents
      // 2.49 cents -> 2 cents
      // 2.5 cents -> 2 cents
      // 2.51 cents -> 3 cents
      assert.equal(await this.math.unitsToCentsRounded(49), 0);
      assert.equal(await this.math.unitsToCentsRounded(50), 1);
      assert.equal(await this.math.unitsToCentsRounded(51), 1);

      assert.equal(await this.math.unitsToCentsRounded(149), 1);
      assert.equal(await this.math.unitsToCentsRounded(150), 2);
      assert.equal(await this.math.unitsToCentsRounded(151), 2);

      assert.equal(await this.math.unitsToCentsRounded(249), 2);
      assert.equal(await this.math.unitsToCentsRounded(250), 3);
      assert.equal(await this.math.unitsToCentsRounded(251), 3);

      // 24.9 cents -> 25 cents
      // 25.0 cents -> 25 cents
      // 25.1 cents -> 25 cents
      // 25.15 cents -> 25 cents
      assert.equal(await this.math.unitsToCentsRounded(2490), 25);
      assert.equal(await this.math.unitsToCentsRounded(2500), 25);
      assert.equal(await this.math.unitsToCentsRounded(2510), 25);
      assert.equal(await this.math.unitsToCentsRounded(2515), 25);

      // 5000 cents -> 5000 cents
      assert.equal(await this.math.unitsToCentsRounded(500000), 5000);
    });
  });

  describe('unitsToCentsBankers (bankersRoundedDiv)', function () {
    it('should return correct results', async function () {
      // 0.49 cents -> 0 cents
      // 0.5 cents -> 0 cents
      // 0.51 cents -> 1 cents
      // 1.49 cents -> 1 cents
      // 1.5 cents -> 2 cents
      // 1.51 cents -> 2 cents
      // 2.49 cents -> 2 cents
      // 2.5 cents -> 2 cents
      // 2.51 cents -> 3 cents
      assert.equal(await this.math.unitsToCentsBankers(49), 0);
      assert.equal(await this.math.unitsToCentsBankers(50), 0);
      assert.equal(await this.math.unitsToCentsBankers(51), 1);

      assert.equal(await this.math.unitsToCentsBankers(149), 1);
      assert.equal(await this.math.unitsToCentsBankers(150), 2);
      assert.equal(await this.math.unitsToCentsBankers(151), 2);

      assert.equal(await this.math.unitsToCentsBankers(249), 2);
      assert.equal(await this.math.unitsToCentsBankers(250), 2);
      assert.equal(await this.math.unitsToCentsBankers(251), 3);

      // 24.9 cents -> 25 cents
      // 25.0 cents -> 25 cents
      // 25.1 cents -> 25 cents
      // 25.15 cents -> 25 cents
      assert.equal(await this.math.unitsToCentsBankers(2490), 25);
      assert.equal(await this.math.unitsToCentsBankers(2500), 25);
      assert.equal(await this.math.unitsToCentsBankers(2510), 25);
      assert.equal(await this.math.unitsToCentsBankers(2515), 25);

      // 5000 cents -> 5000 cents
      assert.equal(await this.math.unitsToCentsBankers(500000), 5000);
    });
  });
});
