pragma solidity ^0.4.11;

import './Crowdsale.sol';

contract FixedRate is Crowdsale {
  uint256 rate;

  function FixedRate(uint256 _rate) {
    rate = _rate;
  }

  function getRate() returns (uint256) {
    return rate;
  }
}
