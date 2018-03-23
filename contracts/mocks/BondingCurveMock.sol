pragma solidity ^0.4.18;

import "../curation-markets/BondingCurve.sol";


contract BondingCurveMock is BondingCurve {
  function BondingCurveMock(
    uint256 _totalSupply,
    uint32 _reserveRatio,
    uint256 _gasPrice) public payable
  {

    reserveRatio = _reserveRatio;
    totalSupply_ = _totalSupply;
    poolBalance = msg.value;
    gasPrice = _gasPrice;

    balances[owner] = _totalSupply;
    Transfer(0x0, owner, _totalSupply);
  }
}

