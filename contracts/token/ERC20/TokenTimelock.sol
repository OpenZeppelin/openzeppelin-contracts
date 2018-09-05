pragma solidity ^0.4.24;

import "./SafeERC20.sol";


/**
 * @title TokenTimelock
 * @dev TokenTimelock is a token holder contract that will allow a
 * beneficiary to extract the tokens after a given release time
 */
contract TokenTimelock {
  using SafeERC20 for IERC20;

  // ERC20 basic token contract being held
  IERC20 private token_;

  // beneficiary of tokens after they are released
  address private beneficiary_;

  // timestamp when token release is enabled
  uint256 private releaseTime_;

  constructor(
    IERC20 _token,
    address _beneficiary,
    uint256 _releaseTime
  )
    public
  {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp);
    token_ = _token;
    beneficiary_ = _beneficiary;
    releaseTime_ = _releaseTime;
  }

  /**
   * @return the token being held.
   */
  function token() public view returns(IERC20) {
    return token_;
  }

  /**
   * @return the beneficiary of the tokens.
   */
  function beneficiary() public view returns(address) {
    return beneficiary_;
  }

  /**
   * @return the time when the tokens are released.
   */
  function releaseTime() public view returns(uint256) {
    return releaseTime_;
  }

  /**
   * @notice Transfers tokens held by timelock to beneficiary.
   */
  function release() public {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime_);

    uint256 amount = token_.balanceOf(address(this));
    require(amount > 0);

    token_.safeTransfer(beneficiary_, amount);
  }
}
