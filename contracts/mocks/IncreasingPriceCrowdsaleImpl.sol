pragma solidity ^0.4.24;

import "../crowdsale/price/IncreasingPriceCrowdsale.sol";
import "../math/SafeMath.sol";

contract IncreasingPriceCrowdsaleImpl is IncreasingPriceCrowdsale {
    constructor (
        uint256 openingTime,
        uint256 closingTime,
        address wallet,
        IERC20 token,
        uint256 initialRate,
        uint256 finalRate
    )
        public
        Crowdsale(initialRate, wallet, token)
        TimedCrowdsale(openingTime, closingTime)
        IncreasingPriceCrowdsale(initialRate, finalRate)
    {}
}
