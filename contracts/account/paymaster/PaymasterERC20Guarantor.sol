// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4337Utils, PackedUserOperation} from "../utils/draft-ERC4337Utils.sol";
import {IERC20, SafeERC20} from "../../token/ERC20/utils/SafeERC20.sol";
import {PaymasterERC20} from "./PaymasterERC20.sol";

/**
 * @dev Extension of {PaymasterERC20} that enables third parties to guarantee user operations.
 *
 * This contract allows a guarantor to pre-fund user operations on behalf of users. The guarantor
 * pays the maximum possible gas cost upfront, and after execution:
 * 1. If the user repays the guarantor, the guarantor gets their funds back
 * 2. If the user fails to repay, the guarantor absorbs the cost
 *
 * A common use case is for guarantors to pay for the operations of users claiming airdrops. In this scenario:
 *
 * * The guarantor pays the gas fees upfront
 * * The user claims their airdrop tokens
 * * The user repays the guarantor from the claimed tokens
 * * If the user fails to repay, the guarantor absorbs the cost
 *
 * The guarantor is identified through the {_fetchGuarantor} function, which must be implemented
 * by developers to determine who can guarantee operations. This allows for flexible guarantor selection
 * logic based on the specific requirements of the application.
 */
abstract contract PaymasterERC20Guarantor is PaymasterERC20 {
    using SafeERC20 for IERC20;

    /// @dev Emitted when a user operation identified by `userOpHash` is guaranteed by a `guarantor` for `prefundAmount`.
    event UserOperationGuaranteed(bytes32 indexed userOpHash, address indexed guarantor, uint256 prefundAmount);

    /**
     * @dev Prefunds the user operation using either the guarantor or the default prefunder.
     * See {PaymasterERC20-_prefund}.
     *
     * Returns `abi.encodePacked(..., userOp.sender)` in `prefundContext` to allow
     * the refund process to identify the user operation sender.
     */
    function _prefund(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        IERC20 token,
        uint256 tokenPrice,
        address prefunder_,
        uint256 maxCost
    )
        internal
        virtual
        override
        returns (bool prefunded, uint256 prefundAmount, address prefunder, bytes memory prefundContext)
    {
        address guarantor = _fetchGuarantor(userOp);
        bool isGuaranteed = guarantor != address(0);
        (prefunded, prefundAmount, prefunder, prefundContext) = super._prefund(
            userOp,
            userOpHash,
            token,
            tokenPrice,
            isGuaranteed ? guarantor : prefunder_,
            maxCost + (isGuaranteed ? 0 : _guaranteedPostOpCost())
        );
        if (prefunder == guarantor) {
            emit UserOperationGuaranteed(userOpHash, prefunder, prefundAmount);
        }
        return (prefunded, prefundAmount, prefunder, abi.encodePacked(prefundContext, userOp.sender));
    }

    /**
     * @dev Handles the refund process for guaranteed operations.
     *
     * If the operation was guaranteed, it attempts to get repayment from the user first and then refunds the guarantor.
     * Otherwise, fallback to {PaymasterERC20-_refund}.
     *
     * NOTE: For guaranteed user operations where the user paid the `actualGasCost` back, this function
     * doesn't call `super._refund`. Consider whether there are side effects in the parent contract that need to be executed.
     */
    function _refund(
        IERC20 token,
        uint256 tokenPrice,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas,
        address prefunder,
        uint256 prefundAmount,
        bytes calldata prefundContext
    ) internal virtual override returns (bool refunded, uint256 actualAmount) {
        address userOpSender = address(bytes20(prefundContext[0x00:0x14]));

        if (prefunder != userOpSender) {
            actualAmount = _erc20Cost(actualGasCost, actualUserOpFeePerGas, tokenPrice);
            if (token.trySafeTransferFrom(userOpSender, address(this), actualAmount)) {
                // The paymaster gets the funds first, so in case of a failure, the guarantor absorbs the cost.
                return (token.trySafeTransfer(prefunder, prefundAmount), actualAmount);
            }
        }
        return
            super._refund(
                token,
                tokenPrice,
                actualGasCost,
                actualUserOpFeePerGas,
                prefunder,
                prefundAmount,
                prefundContext
            );
    }

    /**
     * @dev Fetches the guarantor address and validation data from the user operation.
     *
     * NOTE: Return `address(0)` to disable the guarantor feature. If supported, ensure
     * explicit consent (e.g., signature verification) to prevent unauthorized use.
     */
    function _fetchGuarantor(PackedUserOperation calldata userOp) internal view virtual returns (address guarantor);

    /// @dev Over-estimates the cost of the post-operation logic. Added on top of guaranteed userOps post-operation cost.
    function _guaranteedPostOpCost() internal view virtual returns (uint256) {
        return 15_000;
    }
}
