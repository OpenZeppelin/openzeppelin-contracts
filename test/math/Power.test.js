/* global artifacts, contract, it, before, assert, web3 */
/* eslint-disable prefer-reflect, no-loop-func */
const constants = require('../helpers/powerConstants');
const PowerMock = artifacts.require('PowerMock.sol');
let formula;
const ERROR_MESSAGE = 'invalid opcode';

contract('PowerMock', () => {
  before(async () => {
    formula = await PowerMock.new();
  });
  const ILLEGAL_VAL = web3.toBigNumber(2).toPower(256);
  const MAX_BASE_N = web3
    .toBigNumber(2)
    .toPower(256 - constants.MAX_PRECISION)
    .minus(1);
  const MIN_BASE_D = web3.toBigNumber(1);
  const MAX_EXPONENT = 1000000;

  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_BASE_N;
    const baseD = MAX_BASE_N.minus(1);
    const expN = MAX_EXPONENT * percent / 100;
    const expD = MAX_EXPONENT;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;

    it(`${test}:`, async () => {
      try {
        await formula.powerTest(baseN, baseD, expN, expD);
        assert(percent <= 100, `${test} passed when it should have failed`);
      } catch (error) {
        assert(
          percent >= 101 && error.toString().includes(ERROR_MESSAGE),
          error.message
        );
      }
    });
  }

  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_BASE_N;
    const baseD = MAX_BASE_N.minus(1);
    const expN = MAX_EXPONENT;
    const expD = MAX_EXPONENT * percent / 100;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;

    it(`${test}:`, async () => {
      try {
        await formula.powerTest(baseN, baseD, expN, expD);
        assert(percent <= 100, `${test} passed when it should have failed`);
      } catch (error) {
        assert(
          percent >= 101 && error.toString().includes(ERROR_MESSAGE),
          error.message
        );
      }
    });
  }

  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_BASE_N;
    const baseD = MIN_BASE_D;
    const expN = MAX_EXPONENT * percent / 100;
    const expD = MAX_EXPONENT;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;

    it(`${test}:`, async () => {
      try {
        await formula.powerTest(baseN, baseD, expN, expD);
        assert(percent <= 63, `${test} passed when it should have failed`);
      } catch (error) {
        assert(
          percent >= 64 && error.toString().includes(ERROR_MESSAGE),
          error.message
        );
      }
    });
  }

  for (let percent = 1; percent <= 100; percent++) {
    const baseN = MAX_BASE_N;
    const baseD = MIN_BASE_D;
    const expN = MAX_EXPONENT;
    const expD = MAX_EXPONENT * percent / 100;
    const test = `Function power(0x${baseN.toString(16)}, 0x${baseD.toString(
      16
    )}, ${expN}, ${expD})`;

    it(`${test}:`, async () => {
      try {
        await formula.powerTest(baseN, baseD, expN, expD);
        assert(percent <= 0, `${test} passed when it should have failed`);
      } catch (error) {
        assert(
          percent >= 1 && error.toString().includes(ERROR_MESSAGE),
          error.message
        );
      }
    });
  }

  const values = [
    MAX_BASE_N.dividedToIntegerBy(MIN_BASE_D),
    MAX_BASE_N.dividedToIntegerBy(MAX_BASE_N.minus(1)),
    MIN_BASE_D.plus(1).dividedToIntegerBy(MIN_BASE_D),
  ];

  for (let index = 0; index < values.length; index++) {
    const test = `Function generalLog(0x${values[index].toString(16)})`;

    it(`${test}:`, async () => {
      try {
        const retVal = await formula.generalLogTest(values[index]);
        assert(
          retVal.times(MAX_EXPONENT).lessThan(ILLEGAL_VAL),
          `${test}: output is too large`
        );
      } catch (error) {
        assert(false, error.message);
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
          const retVal = await formula.findPositionInMaxExpArrayTest(input);
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
              output.lessThan(web3.toBigNumber(precision)) &&
              error.toString().includes(ERROR_MESSAGE),
            error.message
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
    const test1 = `Function generalExp(0x${maxExp.toString(16)}, ${precision})`;
    const test2 = `Function generalExp(0x${errExp.toString(16)}, ${precision})`;

    it(`${test1}:`, async () => {
      const retVal = await formula.generalExpTest(maxExp, precision);
      assert(retVal.equals(maxVal), `${test1}: output is wrong`);
    });

    it(`${test2}:`, async () => {
      const retVal = await formula.generalExpTest(errExp, precision);
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
    const test = `Function generalExp(0x${minExp.toString(16)}, ${precision})`;

    it(`${test}:`, async () => {
      const retVal = await formula.generalExpTest(minExp, precision);
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
        const retVal = await formula.floorLog2Test(input);
        assert(
          retVal.equals(output),
          `${test}: output should be ${output.toString(
            10
          )} but it is ${retVal.toString(10)}`
        );
      });
    }
  }

  const Decimal = require('decimal.js');
  Decimal.set({ precision: 100, rounding: Decimal.ROUND_DOWN });
  web3.BigNumber.config({
    DECIMAL_PLACES: 100,
    ROUNDING_MODE: web3.BigNumber.ROUND_DOWN,
  });

  const LOG_MIN = 1;
  const EXP_MIN = 0;
  const LOG_MAX = web3.toBigNumber(Decimal.exp(1).toFixed());
  const EXP_MAX = web3.toBigNumber(Decimal.pow(2, 4).toFixed());
  const FIXED_1 = web3.toBigNumber(2).toPower(constants.MAX_PRECISION);

  for (let percent = 0; percent < 100; percent++) {
    const x = web3
      .toBigNumber(percent)
      .dividedBy(100)
      .times(LOG_MAX.minus(LOG_MIN))
      .plus(LOG_MIN);

    it(`Function optimalLog(${x.toFixed()})`, async () => {
      try {
        const fixedPoint = await formula.optimalLogTest(
          FIXED_1.times(x).truncated()
        );
        const floatPoint = web3.toBigNumber(
          Decimal(x.toFixed())
            .ln()
            .times(FIXED_1.toFixed())
            .toFixed()
        );
        const ratio = fixedPoint.equals(floatPoint)
          ? web3.toBigNumber(1)
          : fixedPoint.dividedBy(floatPoint);
        assert(
          ratio.greaterThanOrEqualTo('0.99999999999999999999999999999999999') &&
            ratio.lessThanOrEqualTo('1'),
          `ratio = ${ratio.toFixed()}`
        );
      } catch (error) {
        assert(false, error.message);
      }
    });
  }

  for (let percent = 0; percent < 100; percent++) {
    const x = web3
      .toBigNumber(percent)
      .dividedBy(100)
      .times(EXP_MAX.minus(EXP_MIN))
      .plus(EXP_MIN);

    it(`Function optimalExp(${x.toFixed()})`, async () => {
      try {
        const fixedPoint = await formula.optimalExpTest(
          FIXED_1.times(x).truncated()
        );
        const floatPoint = web3.toBigNumber(
          Decimal(x.toFixed())
            .exp()
            .times(FIXED_1.toFixed())
            .toFixed()
        );
        const ratio = fixedPoint.equals(floatPoint)
          ? web3.toBigNumber(1)
          : fixedPoint.dividedBy(floatPoint);
        assert(
          ratio.greaterThanOrEqualTo('0.99999999999999999999999999999999999') &&
            ratio.lessThanOrEqualTo('1'),
          `ratio = ${ratio.toFixed()}`
        );
      } catch (error) {
        assert(false, error.message);
      }
    });
  }

  for (let n = 0; n < 256 - constants.MAX_PRECISION; n++) {
    const values = [
      web3.toBigNumber(2).toPower(n),
      web3
        .toBigNumber(2)
        .toPower(n)
        .plus(1),
      web3
        .toBigNumber(2)
        .toPower(n)
        .times(1.5),
      web3
        .toBigNumber(2)
        .toPower(n + 1)
        .minus(1),
    ];

    for (let index = 0; index < values.length; index++) {
      const x = values[index];

      it(`Function generalLog(${x.toFixed()})`, async () => {
        try {
          const fixedPoint = await formula.generalLogTest(
            FIXED_1.times(x).truncated()
          );
          const floatPoint = web3.toBigNumber(
            Decimal(x.toFixed())
              .ln()
              .times(FIXED_1.toFixed())
              .toFixed()
          );
          const ratio = fixedPoint.equals(floatPoint)
            ? web3.toBigNumber(1)
            : fixedPoint.dividedBy(floatPoint);
          assert(
            ratio.greaterThanOrEqualTo(
              '0.99999999999999999999999999999999999'
            ) && ratio.lessThanOrEqualTo('1'),
            `ratio = ${ratio.toFixed()}`
          );
        } catch (error) {
          assert(false, error.message);
        }
      });
    }
  }
});
