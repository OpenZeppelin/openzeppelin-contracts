/* solium-disable security/no-block-members */

pragma solidity ^0.4.24;

import "../token/ERC20/SafeERC20.sol";
import "../ownership/Ownable.sol";
import "../math/SafeMath.sol";


/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and vesting period. Optionally revocable by the
 * owner.
 */
contract TokenVesting is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  event Released(uint256 amount);
  event Revoked();

  // beneficiary of tokens after they are released
  address private _beneficiary;

  uint256 private _cliff;
  uint256 private _start;
  uint256 private _duration;

  bool private _revocable;

  mapping (address => uint256) private _released;
  mapping (address => bool) private _revoked;

  /**
   * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
   * beneficiary, gradually in a linear fashion until start + duration. By then all
   * of the balance will have vested.
   * @param beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param cliffDuration duration in seconds of the cliff in which tokens will begin to vest
   * @param start the time (as Unix time) at which point vesting starts
   * @param duration duration in seconds of the period in which the tokens will vest
   * @param revocable whether the vesting is revocable or not
   */
  constructor(
    address beneficiary,
    uint256 start,
    uint256 cliffDuration,
    uint256 duration,
    bool revocable
  )
    public
  {
    require(beneficiary != address(0));
    require(cliffDuration <= duration);

    _beneficiary = beneficiary;
    _revocable = revocable;
    _duration = duration;
    _cliff = start.add(cliffDuration);
    _start = start;
  }

  /**
   * @return the beneficiary of the tokens.
   */
  function beneficiary() public view returns(address) {
    return _beneficiary;
  }

  /**
   * @return the cliff time of the token vesting.
   */
  function cliff() public view returns(uint256) {
    return _cliff;
  }

  /**
   * @return the start time of the token vesting.
   */
  function start() public view returns(uint256) {
    return _start;
  }

  /**
   * @return the duration of the token vesting.
   */
  function duration() public view returns(uint256) {
    return _duration;
  }

  /**
   * @return true if the vesting is revocable.
   */
  function revocable() public view returns(bool) {
    return _revocable;
  }

  /**
   * @return the amount of the token released.
   */
  function released(address token) public view returns(uint256) {
    return _released[token];
  }

  /**
   * @return true if the token is revoked.
   */
  function revoked(address token) public view returns(bool) {
    return _revoked[token];
  }

  /**
   * @notice Transfers vested tokens to beneficiary.
   * @param token ERC20 token which is being vested
   */
  function release(IERC20 token) public {
    uint256 unreleased = releasableAmount(token);

    require(unreleased > 0);

    _released[token] = _released[token].add(unreleased);

    token.safeTransfer(_beneficiary, unreleased);

    emit Released(unreleased);
  }

  /**
   * @notice Allows the owner to revoke the vesting. Tokens already vested
   * remain in the contract, the rest are returned to the owner.
   * @param token ERC20 token which is being vested
   */
  function revoke(IERC20 token) public onlyOwner {
    require(_revocable);
    require(!_revoked[token]);

    uint256 balance = token.balanceOf(address(this));

    uint256 unreleased = releasableAmount(token);
    uint256 refund = balance.sub(unreleased);

    _revoked[token] = true;

    token.safeTransfer(owner(), refund);

    emit Revoked();
  }

  /**
   * @dev Calculates the amount that has already vested but hasn't been released yet.
   * @param token ERC20 token which is being vested
   */
  function releasableAmount(IERC20 token) public view returns (uint256) {
    return vestedAmount(token).sub(_released[token]);
  }

  /**
   * @dev Calculates the amount that has already vested.
   * @param token ERC20 token which is being vested
   */
  function vestedAmount(IERC20 token) public view returns (uint256) {
    uint256 currentBalance = token.balanceOf(this);
    uint256 totalBalance = currentBalance.add(_released[token]);

    if (block.timestamp < _cliff) {
      return 0;
    } else if (block.timestamp >= _start.add(_duration) || _revoked[token]) {
      return totalBalance;
    } else {
      return totalBalance.mul(block.timestamp.sub(_start)).div(_duration);
    }
  }
}
