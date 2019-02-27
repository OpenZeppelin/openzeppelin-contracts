pragma solidity ^0.5.2;

import "./IERC20.sol";
import "../../math/SafeMath.sol";

/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for ERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using SafeMath for uint256;

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        callAndAssertSuccess(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        callAndAssertSuccess(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function safeApprove(IERC20 token, address spender, uint256 value) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require((value == 0) || (token.allowance(address(this), spender) == 0));
        callAndAssertSuccess(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 newAllowance = token.allowance(address(this), spender).add(value);
        callAndAssertSuccess(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function safeDecreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 newAllowance = token.allowance(address(this), spender).sub(value);
        callAndAssertSuccess(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    /**
     * @dev Performs a function call on a token, asserting its success, which is defined by a) the call succeeding,
     * and b) the return data being either empty or true.
     * @param token The token targeted byt he call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function callAndAssertSuccess(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves.

        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = address(token).call(data);
        require(success);
        
        require(getBooleanReturnValue());
    }

    /**
     * @dev Parses the return value of the last contract call and attempts to return a boolean value out of it.
     */
    function getBooleanReturnValue() private pure returns (bool result) {
        // We need to use inline assembly here, since it is the only way we can utilize the returndatasize opcode.

        // solhint-disable-next-line no-inline-assembly
        assembly {
            switch returndatasize()
            case 0 { // No return value - assume success
                result := 1
            }
            case 32 { // Standard ERC20 - read the returned 32 byte value
                returndatacopy(0, 0, 32)
                result := mload(0)
            }
            default { // Other return sizes are unsupported
                revert(0, 0)
            }
        }
    }
}
