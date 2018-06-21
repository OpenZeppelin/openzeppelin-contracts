pragma solidity ^0.4.21;

import "./ERC20Basic.sol";
import "./SafeERC20.sol";
import "./TokenVesting.sol";
import "../../math/SafeMath.sol";


contract VariableRateTokenVesting is TokenVesting {

  using SafeMath for uint256;
  using SafeERC20 for ERC20Basic;

  // Every element between 0 and 100, and should increase monotonically.
  // [10, 20, 30, ..., 100] means releasing 10% for each period.
  uint256[] public cumulativeRates;

  // Seconds between each period.
  uint256 public interval;


  /**
   * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
   * _beneficiary, with varying vesting rates depending on period.
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _revocable whether the vesting is revocable or not
   * @param _cumulativeRates vesting rates in percentages, every element between 0 and 100
   * and should increase monotonically
   * @param _interval duration in seconds for each vesting period
   */
  constructor(
    address _beneficiary,
    uint256 _start,
    uint256 _cliff,
    bool _revocable,
    uint256[] _cumulativeRates,
    uint256 _interval
  ) public
    // We don't need `duration`, also always allow revoking.
    TokenVesting(_beneficiary, _start, _cliff, /*duration: uint max*/~uint256(0), _revocable)
  {
    // Validate rates.
    for (uint256 i = 0; i < _cumulativeRates.length; ++i) {
      require(_cumulativeRates[i] <= 100);
      if (i > 0) {
        require(_cumulativeRates[i] >= _cumulativeRates[i - 1]);
      }
    }

    cumulativeRates = _cumulativeRates;
    interval = _interval;
  }

  /// @dev Override to use cumulative rates to calculated amount for vesting.
  function vestedAmount(ERC20Basic token) public view returns (uint256) {
    if (now < cliff) {
      return 0;
    }

    uint256 currentBalance = token.balanceOf(this);
    uint256 totalBalance = currentBalance.add(released[token]);

    uint256 timeSinceStart = now.sub(start);
    uint256 currentPeriod = timeSinceStart.div(interval);
    if (currentPeriod >= cumulativeRates.length) {
      return totalBalance;
    }
    return totalBalance.mul(cumulativeRates[currentPeriod]).div(100);
  }
}
