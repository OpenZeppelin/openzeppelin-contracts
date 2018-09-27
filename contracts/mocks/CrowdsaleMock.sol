pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../crowdsale/Crowdsale.sol";


contract CrowdsaleMock is Initializable, Crowdsale {
  constructor(uint256 rate, address wallet, IERC20 token) public Crowdsale(rate, wallet, token) {
    Crowdsale.initialize(rate, wallet, token);
  }
}
