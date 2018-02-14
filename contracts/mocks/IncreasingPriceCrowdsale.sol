pragma solidity ^0.4.18;

import "../crowdsale-refactor/price/IncreasingTimeCrowdsale.sol";
import "../math/SafeMath.sol";

contract IncreasingTimeCrowdsaleImpl is IncreasingTimeCrowdsale {

  function IncreasingTimeCrowdsaleImpl (
      uint256 _startTime,
      uint256 _endTime,
      address _wallet,
      ERC20 _token,
      uint256 _initialRate,
      uint256 _finalRate
    ) public
      Crowdsale(_initialRate, _wallet, _token)
      TimedCrowdsale(_startTime, _endTime)
      IncreasingTimeCrowdsale(_initialRate, _finalRate)
    {
    }

}
