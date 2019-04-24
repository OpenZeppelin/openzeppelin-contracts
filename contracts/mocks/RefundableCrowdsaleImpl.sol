pragma solidity ^0.5.0;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/distribution/RefundableCrowdsale.sol";

contract RefundableCrowdsaleImpl is RefundableCrowdsale {
    constructor (
        uint256 openingTime,
        uint256 closingTime,
        uint256 rate,
        address payable wallet,
        IERC20 token,
        uint256 goal
    )
        public
        Crowdsale(rate, wallet, token)
        TimedCrowdsale(openingTime, closingTime)
        RefundableCrowdsale(goal)
    {
        // solhint-disable-previous-line no-empty-blocks
    }
}
