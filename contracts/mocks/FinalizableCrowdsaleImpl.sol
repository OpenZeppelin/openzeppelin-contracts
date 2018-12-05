pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/distribution/FinalizableCrowdsale.sol";

contract FinalizableCrowdsaleImpl is FinalizableCrowdsale {

    constructor (uint256 openingTime, uint256 closingTime, uint256 rate, address wallet, IERC20 token)
        public
        Crowdsale(rate, wallet, token)
        TimedCrowdsale(openingTime, closingTime)
    {}
}
