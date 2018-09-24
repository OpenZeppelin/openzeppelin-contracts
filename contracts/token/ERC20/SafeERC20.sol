pragma solidity ^0.4.24;

import "../../utils/Address.sol";
import "./ERC20.sol";
import "./IERC20.sol";

/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure.
 * To use this library you can add a `using SafeERC20 for ERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
  using Address for address;

  function safeTransfer(
    IERC20 token,
    address to,
    uint256 value
  )
    internal
  {
    require(token.transfer(to, value));
  }

  function safeTransferFrom(
    IERC20 token,
    address from,
    address to,
    uint256 value
  )
    internal
  {
    require(token.transferFrom(from, to, value));
  }

  function safeApprove(
    IERC20 token,
    address spender,
    uint256 value
  )
    internal
  {
    require(token.approve(spender, value));
  }

  function handleReturnBool() internal pure returns(bool result) {
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      switch returndatasize()
      case 0 { // not a std erc20
        result := 1
      }
      case 32 { // std erc20
        returndatacopy(0, 0, 32)
        result := mload(0)
      }
      default { // anything else, should revert for safety
        revert(0, 0)
      }
    }
  }

  function asmTransfer(IERC20 _token, address _to, uint256 _value) internal returns(bool) {
    require(_token.isContract());
    // solium-disable-next-line security/no-low-level-calls
    require(_token.call(bytes4(keccak256("transfer(address,uint256)")), _to, _value));
    return handleReturnBool();
  }

  function asmTransferFrom(IERC20 _token, address _from, address _to, uint256 _value) internal returns(bool) {
    require(_token.isContract());
    // solium-disable-next-line security/no-low-level-calls
    require(_token.call(bytes4(keccak256("transferFrom(address,address,uint256)")), _from, _to, _value));
    return handleReturnBool();
  }

  function asmApprove(IERC20 _token, address _spender, uint256 _value) internal returns(bool) {
    require(_token.isContract());
    // solium-disable-next-line security/no-low-level-calls
    require(_token.call(bytes4(keccak256("approve(address,uint256)")), _spender, _value));
    return handleReturnBool();
  }
}
