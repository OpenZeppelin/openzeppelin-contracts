// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4337Utils, PackedUserOperation} from "../utils/draft-ERC4337Utils.sol";
import {IERC20, SafeERC20} from "../../token/ERC20/utils/SafeERC20.sol";
import {Math} from "../../utils/math/Math.sol";
import {Paymaster} from "./Paymaster.sol";

/**
 * @dev Extension of {Paymaster} that enables users to pay gas with ERC-20 tokens.
 *
 * To enable this feature, developers must implement the {_fetchDetails} function:
 *
 * ```solidity
 * function _fetchDetails(
 *     PackedUserOperation calldata userOp,
 *     bytes32 userOpHash
 * ) internal view override returns (uint256 validationData, IERC20 token, uint256 tokenPrice) {
 *     // Implement logic to fetch the token, and token price from the userOp
 * }
 * ```
 *
 * The contract follows a pre-charge and refund model:
 * 1. During validation, it pre-charges the maximum possible gas cost
 * 2. After execution, it refunds any unused gas back to the user
 */
abstract contract PaymasterERC20 is Paymaster {
    using ERC4337Utils for *;
    using Math for *;
    using SafeERC20 for IERC20;

    /**
     * @dev Emitted when a user operation identified by `userOpHash` is sponsored by this paymaster
     * using the specified ERC-20 `token`. The `tokenAmount` is the amount charged for the operation,
     * and `tokenPrice` is the price of the token in native currency (e.g., ETH).
     */
    event UserOperationSponsored(
        bytes32 indexed userOpHash,
        address indexed token,
        uint256 tokenAmount,
        uint256 tokenPrice
    );

    /**
     * @dev Throws when the paymaster fails to refund the difference between the `prefundAmount`
     * and the `actualAmount` of `token`.
     */
    error PaymasterERC20FailedRefund(IERC20 token, uint256 prefundAmount, uint256 actualAmount, bytes prefundContext);

    /**
     * @dev See {Paymaster-_validatePaymasterUserOp}.
     *
     * Attempts to retrieve the `token` and `tokenPrice` from the user operation (see {_fetchDetails})
     * and prefund the user operation using these values and the `maxCost` argument (see {_prefund}).
     *
     * Returns `abi.encodePacked(userOpHash, token, tokenPrice, prefundAmount, prefunder, prefundContext)` in
     * `context` if the prefund is successful. Otherwise, it returns empty bytes.
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal virtual override returns (bytes memory context, uint256 validationData) {
        IERC20 token;
        uint256 tokenPrice;
        (validationData, token, tokenPrice) = _fetchDetails(userOp, userOpHash);
        context = abi.encodePacked(userOpHash, token, tokenPrice);
        (bool prefunded, uint256 prefundAmount, address prefunder, bytes memory prefundContext) = _prefund(
            userOp,
            userOpHash,
            token,
            tokenPrice,
            userOp.sender,
            maxCost
        );

        if (validationData == ERC4337Utils.SIG_VALIDATION_FAILED || !prefunded)
            return (bytes(""), ERC4337Utils.SIG_VALIDATION_FAILED);

        return (abi.encodePacked(context, prefundAmount, prefunder, prefundContext), validationData);
    }

    /**
     * @dev Prefunds the `userOp` by charging the maximum possible gas cost (`maxCost`) in ERC-20 `token`.
     *
     * The `token` and `tokenPrice` is obtained from the {_fetchDetails} function and are funded by the `prefunder_`,
     * which is the user operation sender by default. The `prefundAmount` is calculated using {_erc20Cost}.
     *
     * Returns a `prefundContext` that's passed to the {_postOp} function through its `context` return value.
     *
     * NOTE: Consider not reverting if the prefund fails when overriding this function. This is to avoid reverting
     * during the validation phase of the user operation, which may penalize the paymaster's reputation according
     * to ERC-7562 validation rules.
     */
    function _prefund(
        PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        IERC20 token,
        uint256 tokenPrice,
        address prefunder_,
        uint256 maxCost
    ) internal virtual returns (bool prefunded, uint256 prefundAmount, address prefunder, bytes memory prefundContext) {
        uint256 feePerGas = userOp.maxFeePerGas();
        uint256 _prefundAmount = _erc20Cost(maxCost, feePerGas, tokenPrice);
        return (token.trySafeTransferFrom(prefunder_, address(this), _prefundAmount), _prefundAmount, prefunder_, "");
    }

    /**
     * @dev Attempts to refund the user operation after execution. See {_refund}.
     *
     * Reverts with {PaymasterERC20FailedRefund} if the refund fails.
     *
     * IMPORTANT: This function may revert after the user operation has been executed without
     * reverting the user operation itself. Consider implementing a mechanism to handle
     * this case gracefully.
     */
    function _postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal virtual override {
        bytes32 userOpHash = bytes32(context[0x00:0x20]);
        IERC20 token = IERC20(address(bytes20(context[0x20:0x34])));
        uint256 tokenPrice = uint256(bytes32(context[0x34:0x54]));
        uint256 prefundAmount = uint256(bytes32(context[0x54:0x74]));
        address prefunder = address(bytes20(context[0x74:0x88]));
        bytes calldata prefundContext = context[0x88:];

        (bool refunded, uint256 actualAmount) = _refund(
            token,
            tokenPrice,
            actualGasCost,
            actualUserOpFeePerGas,
            prefunder,
            prefundAmount,
            prefundContext
        );
        if (!refunded) {
            revert PaymasterERC20FailedRefund(token, prefundAmount, actualAmount, prefundContext);
        }

        emit UserOperationSponsored(userOpHash, address(token), actualAmount, tokenPrice);
    }

    /**
     * @dev Refunds any unused gas back to the user (i.e. `prefundAmount - actualAmount`) in `token`.
     *
     * The `actualAmount` is calculated using {_erc20Cost} and the `actualGasCost`, `actualUserOpFeePerGas`, `prefundContext`
     * and the `tokenPrice` from the {_postOp}'s context.
     */
    function _refund(
        IERC20 token,
        uint256 tokenPrice,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas,
        address prefunder,
        uint256 prefundAmount,
        bytes calldata /* prefundContext */
    ) internal virtual returns (bool refunded, uint256 actualAmount) {
        uint256 actualAmount_ = _erc20Cost(actualGasCost, actualUserOpFeePerGas, tokenPrice);
        return (token.trySafeTransfer(prefunder, prefundAmount - actualAmount_), actualAmount_);
    }

    /**
     * @dev Retrieves payment details for a user operation.
     *
     * The values returned by this internal function are:
     *
     * * `validationData`: ERC-4337 validation data, indicating success/failure and optional time validity (`validAfter`, `validUntil`).
     * * `token`: Address of the ERC-20 token used for payment to the paymaster.
     * * `tokenPrice`: Price of the token in native currency, scaled by `_tokenPriceDenominator()`.
     *
     * ==== Calculating the token price
     *
     * Given gas fees are paid in native currency, developers can use the `ERC20 price unit / native price unit` ratio to
     * calculate the price of an ERC20 token price in native currency. However, the token may have a different number of decimals
     * than the native currency. For a a generalized formula considering prices in USD and decimals, consider using:
     *
     * `(<ERC-20 token price in $> / 10**<ERC-20 decimals>) / (<Native token price in $> / 1e18) * _tokenPriceDenominator()`
     *
     * For example, suppose token is USDC ($1 with 6 decimals) and native currency is ETH (assuming $2524.86 with 18 decimals),
     * then each unit (1e-6) of USDC is worth `(1 / 1e6) / ((252486 / 1e2) / 1e18) = 396061563.8094785` wei. The `_tokenPriceDenominator()`
     * ensures precision by avoiding fractional value loss. (i.e. the 0.8094785 part).
     */
    function _fetchDetails(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view virtual returns (uint256 validationData, IERC20 token, uint256 tokenPrice);

    /// @dev Over-estimates the cost of the post-operation logic.
    function _postOpCost() internal view virtual returns (uint256) {
        return 30_000;
    }

    /// @dev Denominator used for interpreting the `tokenPrice` returned by {_fetchDetails} as "fixed point" in {_erc20Cost}.
    function _tokenPriceDenominator() internal view virtual returns (uint256) {
        return 1e18;
    }

    /// @dev Calculates the cost of the user operation in ERC-20 tokens.
    function _erc20Cost(uint256 cost, uint256 feePerGas, uint256 tokenPrice) internal view virtual returns (uint256) {
        return (cost + _postOpCost() * feePerGas).mulDiv(tokenPrice, _tokenPriceDenominator());
    }

    /// @dev Public function that allows the withdrawer to extract ERC-20 tokens resulting from gas payments.
    function withdrawTokens(IERC20 token, address recipient, uint256 amount) public virtual onlyWithdrawer {
        if (amount == type(uint256).max) amount = token.balanceOf(address(this));
        token.safeTransfer(recipient, amount);
    }
}
