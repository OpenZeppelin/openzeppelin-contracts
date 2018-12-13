pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/TimedCrowdsale.sol";

contract TimedCrowdsaleImpl is TimedCrowdsale {
    constructor (uint256 openingTime, uint256 closingTime, uint256 rate, address wallet, IERC20 token)
        public
        Crowdsale(rate, wallet, token)
        TimedCrowdsale(openingTime, closingTime)
    {}
}
