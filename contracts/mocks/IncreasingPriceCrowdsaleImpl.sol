pragma solidity ^0.4.18;

import "../crowdsale/price/IncreasingPriceCrowdsale.sol";
import "../math/SafeMath.sol";


contract IncreasingPriceCrowdsaleImpl is IncreasingPriceCrowdsale {

  function IncreasingPriceCrowdsaleImpl (
    uint256 _openingTime,
    uint256 _closingTime,
    address _wallet,
    ERC20 _token,
    uint256 _initialRate,
    uint256 _finalRate
  ) 
    public
    Crowdsale(_initialRate, _wallet, _token)
    TimedCrowdsale(_openingTime, _closingTime)
    IncreasingPriceCrowdsale(_initialRate, _finalRate)
  {
  }

}
