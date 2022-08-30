const { expectRevert } = require('@openzeppelin/test-helpers');

const EvalInfixMock = artifacts.require('EvalInfixMock');

contract('EvalInfix', function () {
  beforeEach(async function () {
    this.EvalInfix = await EvalInfixMock.new();
  });

  describe('Evaluate Infix Expression which includes string array of `1 , 0 , o , a , ( , )`', function () {
    it('evaluates (TRUE or FALSE) to True', async function () {
      expect(await this.EvalInfix.evaluateExp(['1', 'o', '0'], 2, 1)).to.equal(true);
    });

    it('evaluates (TRUE and FALSE) to False', async function () {
      expect(await this.EvalInfix.evaluateExp(['1', 'a', '0'], 2, 1)).to.equal(false);
    });

    it('evaluates (TRUE or ( TRUE and FALSE ) ) to True', async function () {
      expect(await this.EvalInfix.evaluateExp(['1', 'o', '(', '1', 'a', '0', ')'], 3, 4)).to.equal(true);
    });

    it('evaluates (FALSE and ( FALSE or TRUE ) ) to False', async function () {
      expect(await this.EvalInfix.evaluateExp(['0', 'a', '(', '0', 'o', '1', ')'], 3, 4)).to.equal(false);
    });

    it('evaluates (FALSE and FALSE or TRUE ) to true (Precedence Considered)', async function () {
      expect(await this.EvalInfix.evaluateExp(['0', 'a', '0', 'o', '1'], 3, 2)).to.equal(true);
    });

    it('evaluates (TRUE or FALSE and FALSE ) to true', async function () {
      expect(await this.EvalInfix.evaluateExp(['1', 'o', '0', 'a', '0'], 3, 2)).to.equal(true);
    });

    it('evaluates (TRUE or FALSE and FALSE ) to true', async function () {
      expect(await this.EvalInfix.getResult()).to.equal(true);
    });

    it('evaluates (FALSE and ( TRUE or FALSE )  to False', async function () {
      expect(await this.EvalInfix.evaluateExp(['0', 'a', '(', '1', 'o', '0', ')'], 3, 4)).to.equal(false);
    });
  });

  describe('Check Infix Expression Valid or Not ', function () {
    it('Return False For expression (FALSE ( TRUE or FALSE )', async function () {
      expect(await this.EvalInfix.checkValid(['0', '(', '1', 'o', '0', ')'], 3, 3)).to.equal(false);
    });

    it('Reverts For expression (FALSE ( TRUE or FALSE )', async function () {
      await expectRevert(this.EvalInfix.evaluateExp(['0', '(', '1', 'o', '0', ')'], 3, 3), '!!Wrong Infix Exp.');
    });
  });
});
