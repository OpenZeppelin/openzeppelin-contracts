pragma solidity ^0.4.18;

import "../curation-markets/BondingCurve.sol";


contract BondingCurveMock is BondingCurve {
  function BondingCurveMock(
    uint256 _totalSupply,
    uint256 _poolBalance,
    uint32 _reserveRatio,
    uint256 _gasPrice) public
  {
    reserveRatio = _reserveRatio;
    totalSupply_ = _totalSupply;
    poolBalance = _poolBalance;
    gasPrice = _gasPrice;
  }
}
