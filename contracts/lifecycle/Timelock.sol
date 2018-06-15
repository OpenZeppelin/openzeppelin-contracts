pragma solidity ^0.4.24;

import "../token/ERC20/SafeERC20.sol";

/**
 * @title Timelock
 * @dev Timelock is a contract that will allow a
 * beneficiary to extract any tokens sent to it as well as any ether after a given release time
 */
contract Timelock {
  using SafeERC20 for ERC20Basic;

  // beneficiary of tokens after they are released
  address public beneficiary;

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(
    address _beneficiary,
    uint256 _releaseTime
  )
    public
  {
    // solium-disable-next-line security/no-block-members
    require(_beneficiary != address(0));
    require(_releaseTime > block.timestamp);
    beneficiary = _beneficiary;
    releaseTime = _releaseTime;
  }

  /**
   * @notice Transfers tokens held by timelock to beneficiary.
   * @param token The token that is being withdrawn
   */
  function releaseToken(ERC20Basic token) public {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime);

    uint256 amount = token.balanceOf(this);
    require(amount > 0);

    token.safeTransfer(beneficiary, amount);
  }

  /**
  * @notice Transfers any ether held by timelock to beneficiary.
  */
  function release() public {
      require(block.timestamp >= releaseTime);
      require(address(this).balance > 0);

      beneficiary.transfer(address(this).balance);
  }

  /**
  * @notice Make fallback payable
   */
   function () payable {}
}