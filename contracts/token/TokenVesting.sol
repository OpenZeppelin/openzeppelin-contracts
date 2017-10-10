pragma solidity ^0.4.11;

import './ERC20.sol';
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

  event Released(uint256 amount);
  event Revoked();

  // beneficiary of tokens after they are released
  address public beneficiary;

  uint256 public cliff;
  uint256 public start;
  uint256 public duration;

  bool public revocable;

  uint256 public released;

  ERC20 public token;

  /**
   * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
   * _beneficiary, gradually in a linear fashion until _start + _duration. By then all
   * of the balance will have vested.
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _duration duration in seconds of the period in which the tokens will vest
   * @param _revocable whether the vesting is revocable or not
   * @param _token address of the ERC20 token contract
   */
  function TokenVesting(
    address _beneficiary,
    uint256 _start,
    uint256 _cliff,
    uint256 _duration,
    bool    _revocable,
    address _token
  ) {
    require(_beneficiary != 0x0);
    require(_cliff <= _duration);

    beneficiary = _beneficiary;
    start       = _start;
    cliff       = _start + _cliff;
    duration    = _duration;
    revocable   = _revocable;
    token       = ERC20(_token);
  }

  /**
   * @notice Only allow calls from the beneficiary of the vesting contract
   */
  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary);
    _;
  }

  /**
   * @notice Transfers vested tokens to beneficiary.
   */
  function release() onlyBeneficiary public {
    _releaseTo(beneficiary);
  }

  /**
   * @notice Transfers vested tokens to a target address.
   * @param target the address to send the tokens to
   */
  function releaseTo(address target) onlyBeneficiary public {
    _releaseTo(target);
  }

  /**
   * @notice Transfers vested tokens to beneficiary.
   */
  function _releaseTo(address target) internal {
    uint256 vested = vestedAmount();

    require(vested > 0);

    released = released.add(vested);

    token.transfer(target, vested);

    Released(vested);
  }

  /**
   * @notice Allow the beneficiary to change its address
   * @param target the address to transfer the right to
   */
  function changeBeneficiary(address target) onlyBeneficiary public {
    require(target != 0);
    beneficiary = target;
  }

  /**
   * @notice Allows the owner to revoke the vesting. Tokens already vested are sent to the beneficiary.
   */
  function revoke() onlyOwner public {
    require(revocable);

    uint256 balance = token.balanceOf(this);
    uint256 vested = vestedAmount();

    token.transfer(owner, balance - vested);
    token.transfer(beneficiary, vested);

    Revoked();
  }

  /**
   * @dev Calculates the amount that has already vested but hasn't been released yet.
   */
  function vestedAmount() public constant returns (uint256) {
    if (now < cliff) {

      return 0;

    } else if (now >= start + duration) {

      return token.balanceOf(this);

    } else {

      uint256 currentBalance = token.balanceOf(this);
      uint256 totalBalance = currentBalance.add(released);

      uint256 vested = totalBalance.mul(now - start).div(duration);
      uint256 unreleased = vested.sub(released);

      // currentBalance can be 0 in case of vesting being revoked earlier.
      return Math.min256(currentBalance, unreleased);
    }
  }

  /**
   * @notice Allow withdrawing any token other than the relevant one
   */
  function releaseToken(ERC20 _token, uint256 amount) onlyOwner {
    require(_token != token);
    _token.transfer(owner, amount);
  }
}
