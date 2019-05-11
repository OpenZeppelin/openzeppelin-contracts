pragma solidity ^0.5.0;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/TimedCrowdsale.sol";

contract TimedCrowdsaleImpl is TimedCrowdsale {
    constructor (uint256 openingTime, uint256 closingTime, uint256 rate, address payable wallet, IERC20 token)
        public
        Crowdsale(rate, wallet, token)
        TimedCrowdsale(openingTime, closingTime)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function extendTime(uint256 closingTime) public {
        _extendTime(closingTime);
    }
}
