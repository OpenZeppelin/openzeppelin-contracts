pragma solidity ^0.4.11;

import './ERC20Basic.sol';
import '../ownership/Ownable.sol';
import '../math/Math.sol';
import '../math/SafeMath.sol';

/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and vesting period. Optionally revocable by the
 * owner.
 */
contract TokenVesting is Ownable {
  using SafeMath for uint256;

  event Release(uint256 amount);
  event Revoke();

  // beneficiary of tokens after they are released
  address beneficiary;

  uint256 cliff;
  uint256 start;
  uint256 duration;

  bool revocable;

  mapping (address => uint256) released;

  /**
   * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
   * _beneficiary, gradually in a linear fashion until _start + _duration. By then all
   * of the balance will have vested.
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _duration duration in seconds of the period in which the tokens will vest
   * @param _revocable whether the vesting is revocable or not
   */
  function TokenVesting(address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration, bool _revocable) {
    require(_beneficiary != 0x0);
    require(_cliff < _duration);
    require(_start >= now);

    beneficiary = _beneficiary;
    revocable = _revocable;
    duration = _duration;
    cliff = _start + _cliff;
    start = _start;
  }

  /**
   * @notice Transfers vested tokens to beneficiary.
   * @param token ERC20 token which is being vested
   */
  function release(ERC20Basic token) {
    uint256 vested = vestedAmount(token);

    require(vested > 0);

    token.transfer(beneficiary, vested);

    released[token] = released[token].add(vested);

    Release(vested);
  }

  /**
   * @notice Allows the owner to revoke the vesting. Tokens already vested remain in the contract.
   * @param token ERC20 token which is being vested
   */
  function revoke(ERC20Basic token) onlyOwner {
    require(revocable);

    uint256 balance = token.balanceOf(this);

    uint256 vested = vestedAmount(token);

    token.transfer(owner, balance - vested);

    Revoke();
  }

  /**
   * @dev Calculates the amount that has already vested but not released.
   * @param token ERC20 token which is being vested
   */
  function vestedAmount(ERC20Basic token) constant returns (uint256) {
    if (now < cliff) {
      return 0;
    } else if (now >= start + duration) {
      return token.balanceOf(this);
    } else {
      uint256 currentBalance = token.balanceOf(this);
      uint256 totalBalance = currentBalance.add(released[token]);

      uint256 vested = totalBalance.mul(now - start).div(duration);
      uint256 unreleased = vested.sub(released[token]);

      // currentBalance can be 0 in case of a revoke
      return Math.min256(currentBalance, unreleased);
    }
  }
}
