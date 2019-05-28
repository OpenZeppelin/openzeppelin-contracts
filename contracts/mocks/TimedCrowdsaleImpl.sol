pragma solidity ^0.5.2;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/TimedCrowdsale.sol";

contract TimedCrowdsaleImpl is TimedCrowdsale {
    constructor (uint256 openingTime, uint256 closingTime, uint256 rate, address payable wallet, IERC20 token)
        public
    {
        Crowdsale.initialize(rate, wallet, token);
        TimedCrowdsale.initialize(openingTime, closingTime);
    }

    function extendTime(uint256 closingTime) public {
        _extendTime(closingTime);
    }
}
