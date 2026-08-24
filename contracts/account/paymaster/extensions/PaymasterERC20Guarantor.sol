// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (account/paymaster/extensions/PaymasterERC20Guarantor.sol)

pragma solidity ^0.8.20;

import {ERC4337Utils, PackedUserOperation} from "../../utils/ERC4337Utils.sol";
import {IERC20, SafeERC20} from "../../../token/ERC20/utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";
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
    using ERC4337Utils for *;
    using Math for *;
    using SafeERC20 for IERC20;

    /// @dev Emitted when a user operation identified by `userOpHash` is guaranteed by a `guarantor` for `prefundAmount`.
    event UserOperationGuaranteed(bytes32 indexed userOpHash, address indexed guarantor, uint256 prefundAmount);

    /**
     * @dev Prefunds the user operation using either the guarantor or the default prefunder, and
     * appends `userOp.sender` to the tail of `prefundContext` so the refund process can identify
     * the user operation sender.
     *
     * For guaranteed ops, `prefundAmount` is inflated by {_guaranteedPostOpCost} worth of tokens
     * so the prefund pulled from the guarantor covers the extra postOp work done in {_refund}
     * ({SafeERC20-trySafeTransferFrom} from the user + {SafeERC20-trySafeTransfer} to the guarantor).
     *
     * Guaranteed ops whose `paymasterPostOpGasLimit` cannot cover the guaranteed {_refund}
     * ({PaymasterERC20-_postOpCost} + {_guaranteedPostOpCost}) are rejected with `SIG_VALIDATION_FAILED`.
     * The floor uses the value returned by those virtuals, so an integrator override that under-estimates
     * the actual token-specific cost reintroduces the strand-the-prefund failure mode described in
     * {PaymasterERC20-_postOp}. Size {PaymasterERC20-_postOpCost} and {_guaranteedPostOpCost} for the
     * specific ERC-20 accepted by the paymaster.
     *
     * Provisioning exactly the floor carries no unused-gas penalty: {_postOpGasBudget} covers it, so
     * {PaymasterERC20-_postOpGasPenalty} only prices the limit provisioned on top of it.
     */
    function _prefund(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        IERC20 token,
        uint256 tokenPrice,
        address prefunder_,
        uint256 prefundAmount_
    )
        internal
        virtual
        override
        returns (bool success, address prefunder, uint256 prefundAmount, bytes memory prefundContext)
    {
        address guarantor = _fetchGuarantor(userOp);
        bool isGuaranteed = guarantor != address(0);

        // If there is a guarantor, add more funds to cover the extra postOp cost
        // and set the guarantor as the prefunder.
        if (isGuaranteed) {
            // Reject before pulling funds if the postOp gas budget can't cover the guaranteed {_refund};
            // otherwise postOp reverts and strands the guarantor's prefund (see {PaymasterERC20-_postOp}).
            if (userOp.paymasterPostOpGasLimit() < _postOpCost() + _guaranteedPostOpCost())
                return (false, prefunder_, prefundAmount_, "");

            // `_erc20Cost` may return `type(uint256).max` as an overflow sentinel. `saturatingAdd` preserves it
            // so the bad value reaches `trySafeTransferFrom` and fails there, instead of reverting here.
            uint256 guaranteedPostOpCost = _erc20Cost(_guaranteedPostOpCost() * userOp.maxFeePerGas(), tokenPrice);
            prefundAmount_ = prefundAmount_.saturatingAdd(guaranteedPostOpCost);
            prefunder_ = guarantor;
        }
        (success, prefunder, prefundAmount, prefundContext) = super._prefund(
            userOp,
            userOpHash,
            token,
            tokenPrice,
            prefunder_,
            prefundAmount_
        );
        if (prefunder == guarantor) {
            emit UserOperationGuaranteed(userOpHash, prefunder, prefundAmount);
        }
        return (success, prefunder, prefundAmount, abi.encodePacked(prefundContext, userOp.sender));
    }

    /**
     * @dev Handles the refund process for guaranteed operations.
     *
     * * **Non-guaranteed** (`prefunder == userOp.sender`): forward to {PaymasterERC20-_refund} and
     *   propagate the effective amount returned by `super._refund` so downstream extensions can
     *   report their actual charge (e.g. a fixed-credit policy that reduces the settlement).
     * * **Guaranteed**: augment `actualAmount` by {_guaranteedPostOpCost} * `actualUserOpFeePerGas`
     *   (priced in tokens), pull it from `userOp.sender`, and call {PaymasterERC20-_refund} with
     *   `actualAmount = 0` so the guarantor gets the full `prefundAmount` back. If the user fails to pay,
     *   the guarantor absorbs the GUARANTEED cost (not the base cost).
     *
     * NOTE: For guaranteed ops, the returned `effectiveAmount` mirrors the value emitted in
     * {UserOperationGuaranteed}: the guarantor's inflated `actualAmount`, not necessarily the
     * amount that `super._refund` settled. Only the non-guaranteed branch propagates what a
     * downstream extension actually charged.
     */
    function _refund(
        IERC20 token,
        uint256 tokenPrice,
        uint256 actualAmount,
        uint256 actualUserOpFeePerGas,
        address prefunder,
        uint256 prefundAmount,
        bytes calldata prefundContext
    ) internal virtual override returns (bool refunded, uint256 effectiveAmount) {
        address userOpSender = address(bytes20(prefundContext[prefundContext.length - 20:]));

        // If the prefunder is not the userOp sender, it means the operation is guaranteed
        // In that case we:
        // 1. update the actualAmount to include the extra postOp cost.
        // 2. register that updated amount as the effective cost of the operation (for event logs).
        // 3. try to pull the actualAmount from the userOp sender.
        // 4. on success, zero out the actualAmount so super refunds the guarantor in full;
        //    on failure, leave it so super deducts it and the guarantor absorbs the cost.
        if (prefunder != userOpSender) {
            // If the values used here are able to cause that _erc20Cost math to fail (and return type(uint256).max),
            // then the same failure must have already happened in the _prefund phase, causing the whole userOp to
            // fail before even reaching this point.
            uint256 guaranteedPostOpAmount = _erc20Cost(_guaranteedPostOpCost() * actualUserOpFeePerGas, tokenPrice);
            actualAmount += guaranteedPostOpAmount;
            effectiveAmount = actualAmount;

            // The paymaster gets the funds first, so in case of a failure, the guarantor absorbs the cost.
            if (token.trySafeTransferFrom(userOpSender, address(this), actualAmount)) {
                actualAmount = 0;
            }
        }

        uint256 returnedEffectiveAmount;
        bytes calldata forwardedContext = prefundContext[:prefundContext.length - 20];
        (refunded, returnedEffectiveAmount) = super._refund(
            token,
            tokenPrice,
            actualAmount,
            actualUserOpFeePerGas,
            prefunder,
            prefundAmount,
            forwardedContext
        );
        return (refunded, Math.ternary(prefunder != userOpSender, effectiveAmount, returnedEffectiveAmount));
    }

    /**
     * @dev See {PaymasterERC20-_postOpGasBudget}. Widened by {_guaranteedPostOpCost} for guaranteed operations:
     * that is the extra postOp gas they are billed, and which {_prefund} requires them to provision.
     */
    function _postOpGasBudget(PackedUserOperation calldata userOp) internal view virtual override returns (uint256) {
        return
            super._postOpGasBudget(userOp) +
            Math.ternary(_fetchGuarantor(userOp) == address(0), 0, _guaranteedPostOpCost());
    }

    /**
     * @dev Fetches the guarantor address and validation data from the user operation.
     *
     * NOTE: Return `address(0)` to disable the guarantor feature. If supported, ensure
     * explicit consent (e.g., signature verification) to prevent unauthorized use.
     */
    function _fetchGuarantor(PackedUserOperation calldata userOp) internal view virtual returns (address guarantor);

    /**
     * @dev Over-estimates the cost of the post-operation logic. Added on top of {PaymasterERC20-_postOpCost} for
     * guaranteed userOps.
     *
     * NOTE: Like {PaymasterERC20-_postOpCost}, override with a higher value for gas-heavier tokens.
     */
    function _guaranteedPostOpCost() internal view virtual returns (uint256) {
        return 15_000;
    }
}
