/* global artifacts, contract, it, before, assert, web3 */
/* eslint-disable prefer-reflect, no-loop-func */
const constants = require('../helpers/powerConstants');
const PowerMock = artifacts.require('PowerMock.sol');
let formula;

contract('PowerMock', () => {
  before(async () => {
    formula = await PowerMock.new();
  });
  const ILLEGAL_VALUE = web3.toBigNumber(2).toPower(256);
  const MAX_NUMERATOR = web3
    .toBigNumber(2)
    .toPower(256 - constants.MAX_PRECISION)
    .minus(1);
  const MIN_DENOMINATOR = web3.toBigNumber(1);
  const MAX_EXPONENT = 1000000;
  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_NUMERATOR;
    const baseD = MAX_NUMERATOR.minus(1);
    const expN = MAX_EXPONENT * percent / 100;
    const expD = MAX_EXPONENT;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;
    it(`${test}:`, async () => {
      try {
        await formula.powerTest.call(baseN, baseD, expN, expD);
        assert(percent <= 100, `${test} passed when it should have failed`);
      } catch (error) {
        assert(percent >= 101, `${test} failed when it should have passed`);
      }
    });
  }
  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_NUMERATOR;
    const baseD = MAX_NUMERATOR.minus(1);
    const expN = MAX_EXPONENT;
    const expD = MAX_EXPONENT * percent / 100;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;
    it(`${test}:`, async () => {
      try {
        await formula.powerTest.call(baseN, baseD, expN, expD);
        assert(percent <= 100, `${test} passed when it should have failed`);
      } catch (error) {
        assert(percent >= 101, `${test} failed when it should have passed`);
      }
    });
  }
  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_NUMERATOR;
    const baseD = MIN_DENOMINATOR;
    const expN = MAX_EXPONENT * percent / 100;
    const expD = MAX_EXPONENT;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;
    it(`${test}:`, async () => {
      try {
        await formula.powerTest.call(baseN, baseD, expN, expD);
        assert(percent <= 63, `${test} passed when it should have failed`);
      } catch (error) {
        assert(percent >= 64, `${test} failed when it should have passed`);
      }
    });
  }
  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_NUMERATOR;
    const baseD = MIN_DENOMINATOR;
    const expN = MAX_EXPONENT;
    const expD = MAX_EXPONENT * percent / 100;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;
    it(`${test}:`, async () => {
      try {
        await formula.powerTest.call(baseN, baseD, expN, expD);
        assert(percent <= 0, `${test} passed when it should have failed`);
      } catch (error) {
        assert(percent >= 1, `${test} failed when it should have passed`);
      }
    });
  }
  const cases = [
    {
      numerator: MAX_NUMERATOR,
      denominator: MAX_NUMERATOR.minus(1),
      assertion: true,
    },
    { numerator: MAX_NUMERATOR, denominator: MIN_DENOMINATOR, assertion: true },
    {
      numerator: MAX_NUMERATOR.plus(1),
      denominator: MIN_DENOMINATOR,
      assertion: false,
    },
  ];
  for (let index = 0; index < cases.length; index++) {
    const numerator = cases[index].numerator;
    const denominator = cases[index].denominator;
    const assertion = cases[index].assertion;
    const test = `Function ln(0x${numerator.toString(
      16
    )}, 0x${denominator.toString(16)})`;
    it(`${test}:`, async () => {
      try {
        const retVal = await formula.lnTest.call(numerator, denominator);
        assert(
          retVal.times(MAX_EXPONENT).lessThan(ILLEGAL_VALUE),
          `${test}: output is too large`
        );
        assert(assertion, `${test} failed when it should have passed`);
      } catch (error) {
        assert(!assertion, `${test} failed when it should have passed`);
      }
    });
  }
  for (
    let precision = constants.MIN_PRECISION;
    precision <= constants.MAX_PRECISION;
    precision++
  ) {
    const maxExp = web3.toBigNumber(constants.maxExpArray[precision]);
    const shlVal = web3
      .toBigNumber(2)
      .toPower(constants.MAX_PRECISION - precision);
    const tuples = [
      {
        input: maxExp
          .plus(0)
          .times(shlVal)
          .minus(1),
        output: web3.toBigNumber(precision - 0),
      },
      {
        input: maxExp
          .plus(0)
          .times(shlVal)
          .minus(0),
        output: web3.toBigNumber(precision - 0),
      },
      {
        input: maxExp
          .plus(1)
          .times(shlVal)
          .minus(1),
        output: web3.toBigNumber(precision - 0),
      },
      {
        input: maxExp
          .plus(1)
          .times(shlVal)
          .minus(0),
        output: web3.toBigNumber(precision - 1),
      },
    ];
    for (let index = 0; index < tuples.length; index++) {
      const input = tuples[index].input;
      const output = tuples[index].output;
      const test = `Function findPositionInMaxExpArray(0x${input.toString(16)})`;
      it(`${test}:`, async () => {
        try {
          const retVal = await formula.findPositionInMaxExpArrayTest.call(input);
          assert(
            retVal.equals(output),
            `${test}: output should be ${output.toString(
              10
            )} but it is ${retVal.toString(10)}`
          );
          assert(
            precision > constants.MIN_PRECISION ||
              !output.lessThan(web3.toBigNumber(precision)),
            `${test} passed when it should have failed`
          );
        } catch (error) {
          assert(
            precision === constants.MIN_PRECISION &&
              output.lessThan(web3.toBigNumber(precision)),
            `${test} failed when it should have passed`
          );
        }
      });
    }
  }
  for (
    let precision = constants.MIN_PRECISION;
    precision <= constants.MAX_PRECISION;
    precision++
  ) {
    const maxExp = web3.toBigNumber(constants.maxExpArray[precision]);
    const maxVal = web3.toBigNumber(constants.maxValArray[precision]);
    const errExp = maxExp.plus(1);
    const test1 = `Function fixedExp(0x${maxExp.toString(16)}, ${precision})`;
    const test2 = `Function fixedExp(0x${errExp.toString(16)}, ${precision})`;
    it(`${test1}:`, async () => {
      const retVal = await formula.fixedExpTest.call(maxExp, precision);
      assert(retVal.equals(maxVal), `${test1}: output is wrong`);
    });
    it(`${test2}:`, async () => {
      const retVal = await formula.fixedExpTest.call(errExp, precision);
      assert(
        retVal.lessThan(maxVal),
        `${test2}:  output indicates that maxExpArray[${precision}] is wrong`
      );
    });
  }
  for (
    let precision = constants.MIN_PRECISION;
    precision <= constants.MAX_PRECISION;
    precision++
  ) {
    const minExp = web3.toBigNumber(constants.maxExpArray[precision - 1]).plus(1);
    const minVal = web3.toBigNumber(2).toPower(precision);
    const test = `Function fixedExp(0x${minExp.toString(16)}, ${precision})`;
    it(`${test}:`, async () => {
      const retVal = await formula.fixedExpTest.call(minExp, precision);
      assert(
        retVal.greaterThanOrEqualTo(minVal),
        `${test}: output is too small`
      );
    });
  }
  for (let n = 1; n <= 255; n++) {
    const tuples = [
      { input: web3.toBigNumber(2).toPower(n), output: web3.toBigNumber(n) },
      {
        input: web3
          .toBigNumber(2)
          .toPower(n)
          .plus(1),
        output: web3.toBigNumber(n),
      },
      {
        input: web3
          .toBigNumber(2)
          .toPower(n + 1)
          .minus(1),
        output: web3.toBigNumber(n),
      },
    ];
    for (let index = 0; index < tuples.length; index++) {
      const input = tuples[index].input;
      const output = tuples[index].output;
      const test = `Function floorLog2(0x${input.toString(16)})`;
      it(`${test}:`, async () => {
        const retVal = await formula.floorLog2Test.call(input);
        assert(
          retVal.equals(output),
          `${test}: output should be ${output.toString(
            10
          )} but it is ${retVal.toString(10)}`
        );
      });
    }
  }
});
