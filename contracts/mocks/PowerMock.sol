pragma solidity ^0.4.18;
import "../math/Power.sol";


/*
    BancorFormula test helper that exposes some BancorFormula functions
*/
contract PowerMock is Power {
  function PowerMock()  public {
  }

  function powerTest(
    uint256 _baseN,
    uint256 _baseD,
    uint32 _expN,
    uint32 _expD
  ) public constant returns (uint256, uint8)
  {
    return super.power(
      _baseN,
      _baseD,
      _expN,
      _expD
    );
  }

  function lnTest(uint256 _numerator, uint256 _denominator) public constant returns (uint256) {
    return super.ln(_numerator, _denominator);
  }

  function findPositionInMaxExpArrayTest(uint256 _x) public constant returns (uint8) {
    return super.findPositionInMaxExpArray(_x);
  }

  function fixedExpTest(uint256 _x, uint8 _precision) public constant returns (uint256) {
    return super.fixedExp(_x, _precision);
  }

  function floorLog2Test(uint256 _n) public constant returns (uint8) {
    return super.floorLog2(_n);
  }
}
