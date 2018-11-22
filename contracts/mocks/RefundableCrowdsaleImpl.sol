pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Mintable.sol";
import "../crowdsale/distribution/RefundableCrowdsale.sol";

contract RefundableCrowdsaleImpl is RefundableCrowdsale {
    constructor (
        uint256 openingTime,
        uint256 closingTime,
        uint256 rate,
        address wallet,
        ERC20Mintable token,
        uint256 goal
    )
        public
        Crowdsale(rate, wallet, token)
        TimedCrowdsale(openingTime, closingTime)
        RefundableCrowdsale(goal)
    {}
}
