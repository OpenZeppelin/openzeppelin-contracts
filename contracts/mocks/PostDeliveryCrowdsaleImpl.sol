pragma solidity ^0.5.0;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/distribution/PostDeliveryCrowdsale.sol";

contract PostDeliveryCrowdsaleImpl is PostDeliveryCrowdsale {
    constructor (uint256 openingTime, uint256 closingTime, uint256 rate, address payable wallet, IERC20 token)
        public
        TimedCrowdsale(openingTime, closingTime)
        Crowdsale(rate, wallet, token)
    {
        // solhint-disable-previous-line no-empty-blocks
    }
}
