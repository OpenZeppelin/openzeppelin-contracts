pragma solidity ^0.4.18;

import "./StandardToken.sol";
import "../../ownership/Ownable.sol";


/**
 * @title Inflationary token
 * to use this contract, specify a time interval — this is how often you want to
 * mint new tokens, and an inflation rate for that interval
 * ex:
 * timeInterval = 1 hours;
 * inflationRatePerInterval = 1.0001 * (10 ** 18);
 * to compute inflation rate for 1 hour based on yearly inflation use this formula:
 * hourlyRate = (1 + yearlyRate)^1/(24 * 365)
 * @dev Simple ERC20 token with inflation calculated on at discrete intervals
 */
contract InflationaryToken is StandardToken, Ownable {

  uint256 internal lastInflationCalc;
  // inflationRatePerInterval should be multiplied by 1e18
  uint256 public inflationRatePerInterval;
  uint256 public timeInterval;

  event LogInflation(string logString, uint256 value);

  /**
   * Compute interval since last inflation update (on call)
   * @return uint256 Time intervals since last update
   */
  function intervalsSinceLastInflationUpdate() public view returns(uint256) {
    uint256 timeInt = timeInterval;
    return now / timeInt - lastInflationCalc / timeInt;
  }

  /**
   * @dev Mint new tokens if enough time has elapsed since last mint
   * @param _to Address where new tokens should be sent
   */
  function mintTokens(address _to) onlyOwner public returns (bool) {
    uint256 newTokens = computeInflation(totalSupply_);
    uint256 timeInt = timeInterval;

    // update last inflation calculation (rounding down to nearest timeInterval)
    lastInflationCalc = (now / timeInt) * timeInt;
    totalSupply_ = totalSupply_.add(newTokens);
    balances[_to] = balances[_to].add(newTokens);
    Transfer(address(0), _to, newTokens);
    return true;
  }

  /**
   * @dev Function to compute how many tokens should be minted
   * @param _tokenSupply The token supply to be used for inflation calculation
   * @return A uint256 specifying number of new tokens to mint
   */
  function computeInflation(uint256 _tokenSupply) public returns (uint256) {
    // calculate inflation only once per hour

    // optimization
    uint256 infRate = inflationRatePerInterval;
    uint256 timeInt = timeInterval;
    uint256 currentTime = now;

    // compute the number of timeInterval elapsed since the last time we minted infation tokens
    uint256 intervalsSinceLastMint = currentTime / timeInt - lastInflationCalc / timeInt;

    // only update at most once an hour
    require(intervalsSinceLastMint > 0);

    // our hourly inflation rate
    uint256 rate = infRate;

    // compute inflation for total timeIntervals elapsed
    for (uint256 i = 1; i < intervalsSinceLastMint; i++) {
      rate = rate.mul(infRate) / (10 ** 18);
    }
    // update total supply
    return _tokenSupply.mul(rate).div(10 ** 18).sub(_tokenSupply);
  }
}
