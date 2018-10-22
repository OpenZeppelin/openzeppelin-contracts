pragma solidity ^0.4.24;

import "./IERC20.sol";
import "../../access/roles/OperatorRole.sol";

/**
 * @title TokenRecover
 * @author Vittorio Minacori (@vittominacori)
 * @dev Allow to recover any ERC20 token sent into the contract for error.
 * Do not use if your contract is a token holder because of `operator` can move tokens bypassing your logic.
 */
contract TokenRecover is OperatorRole {

  /**
   * @dev Recover requested ERC20 token and send them to provided address.
   * @param tokenAddress The token contract address to recover.
   * @param receiverAddress The receiver address to send the tokens to.
   * @param amount Number of tokens to be sent.
   */
  function recoverERC20(
    address tokenAddress,
    address receiverAddress,
    uint256 amount
  )
    public
    onlyOperator
  {
    require(tokenAddress != address(0));
    IERC20(tokenAddress).transfer(receiverAddress, amount);
  }
}
