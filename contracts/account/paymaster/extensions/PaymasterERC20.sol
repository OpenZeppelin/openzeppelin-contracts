// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4337Utils, PackedUserOperation} from "../../utils/draft-ERC4337Utils.sol";
import {IERC20, SafeERC20} from "../../../token/ERC20/utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";
import {Paymaster} from "../Paymaster.sol";

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
 *
 * NOTE: Developers MUST override {_minTokenPrice} to explicitly set a floor on the token price.
 *
 * [IMPORTANT]
 * ====
 * The {_withdrawTokens} function is `internal` so that developers can expose it under the public interface and
 * authorization mechanism of their choice. Public versions of {_withdrawTokens} MUST be exposed and properly authorized,
 * otherwise the tokens will be permanently stuck in the paymaster.
 *
 * Example implementation exposing the {_withdrawTokens} function using {AccessControl}:
 *
 * ```solidity
 * contract MyPaymaster is Paymaster, AccessControl {
 *     bytes32 private constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
 *
 *     constructor() {
 *         _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
 *     }
 *
 *     function withdrawTokens(IERC20 token, address recipient, uint256 amount) public virtual onlyRole(WITHDRAWER_ROLE) {
 *         _withdrawTokens(token, recipient, amount);
 *     }
 *
 *     ...
 * }
 * ```
 * ====
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
        address userOpSender = userOp.sender;
        (validationData, token, tokenPrice) = _fetchDetails(userOp, userOpHash);

        if (
            address(uint160(validationData)) == address(uint160(ERC4337Utils.SIG_VALIDATION_FAILED)) ||
            tokenPrice < _minTokenPrice()
        ) return (bytes(""), ERC4337Utils.SIG_VALIDATION_FAILED);

        // If the _erc20Cost math fails, the returned value will be type(uint256).max, which we will never be able
        // to charge as a prefund. The `trySafeTransferFrom` in the `_prefund` will fail, causing success to be false.
        uint256 maxTokenCost = _erc20Cost(maxCost + _postOpCost() * userOp.maxFeePerGas(), tokenPrice);
        (bool success, address prefunder, uint256 prefundAmount, bytes memory prefundContext) = _prefund(
            userOp,
            userOpHash,
            token,
            tokenPrice,
            userOpSender,
            maxTokenCost
        );

        return
            success
                ? (
                    abi.encodePacked(userOpHash, token, tokenPrice, prefundAmount, prefunder, prefundContext),
                    validationData
                )
                : (bytes(""), ERC4337Utils.SIG_VALIDATION_FAILED);
    }

    /**
     * @dev Charges `prefundAmount` of `token` from `prefunder_` and returns the effective prefund actually pulled.
     *
     * The base implementation pulls exactly the requested `prefundAmount`. Extensions may inflate the amount
     * (e.g. a guarantor adds the cost of the extra postOp work it performs) and must return the effective value.
     *
     * Returns `(success, prefunder, effectivePrefundAmount, prefundContext)`. `prefundContext` is forwarded to
     * {_postOp} through its `context` argument and may be used by overrides to carry data into {_refund}.
     *
     * NOTE: Consider not reverting if the prefund fails when overriding this function. This is to avoid reverting
     * during the validation phase of the user operation, which may penalize the paymaster's reputation according
     * to ERC-7562 validation rules.
     */
    function _prefund(
        PackedUserOperation calldata /* userOp */,
        bytes32 /* userOpHash */,
        IERC20 token,
        uint256 /* tokenPrice */,
        address prefunder_,
        uint256 prefundAmount_
    ) internal virtual returns (bool success, address prefunder, uint256 prefundAmount, bytes memory prefundContext) {
        return (token.trySafeTransferFrom(prefunder_, address(this), prefundAmount_), prefunder_, prefundAmount_, "");
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

        // If the _erc20Cost math fails, the returned value will be type(uint256).max, which we will never be able
        // to charge as a refund. The `trySafeTransferFrom` in the `_refund` will fail, causing success to be false.
        uint256 actualTokenCost = _erc20Cost(actualGasCost + _postOpCost() * actualUserOpFeePerGas, tokenPrice);
        (bool success, uint256 actualAmount) = _refund(
            token,
            tokenPrice,
            actualTokenCost,
            actualUserOpFeePerGas,
            prefunder,
            prefundAmount,
            prefundContext
        );
        if (!success) revert PaymasterERC20FailedRefund(token, prefundAmount, actualAmount, prefundContext);

        emit UserOperationSponsored(userOpHash, address(token), actualAmount, tokenPrice);
    }

    /**
     * @dev Refunds `prefundAmount - actualAmount` of `token` back to `prefunder` and returns the
     * `actualAmount` actually charged.
     *
     * `actualAmount` is pre-computed by {_postOp} via {_erc20Cost}. Extensions may change it (e.g. a
     * guarantor adds its extra postOp cost or zeroes it out after pulling from the user) and must
     * return the value that was effectively charged.
     *
     * Requirements:
     *
     * - `actualAmount <= prefundAmount`.
     */
    function _refund(
        IERC20 token,
        uint256 /* tokenPrice */,
        uint256 actualAmount_,
        uint256 /* actualUserOpFeePerGas */,
        address prefunder,
        uint256 prefundAmount,
        bytes calldata /* prefundContext */
    ) internal virtual returns (bool success, uint256 actualAmount) {
        // Under ERC-4337 EntryPoint, `actualGasCost <= maxCost` and `actualUserOpFeePerGas <= maxFeePerGas`,
        // so `actualAmount_ <= prefundAmount` holds.
        return (token.trySafeTransfer(prefunder, prefundAmount - actualAmount_), actualAmount_);
    }

    /**
     * @dev Retrieves payment details for a user operation.
     *
     * The values returned by this internal function are:
     *
     * * `validationData`: ERC-4337 validation data, indicating success/failure and optional time validity (`validAfter`, `validUntil`).
     * * `token`: Address of the ERC-20 token used for payment to the paymaster.
     * * `tokenPrice`: Token units charged per wei of gas, scaled by `_tokenPriceDenominator()`.
     *
     * ==== Calculating the token price
     *
     * `tokenPrice` is the multiplier {_erc20Cost} applies to a native-currency gas cost to produce a token amount:
     * `tokenAmount = (nativeCost * tokenPrice) / _tokenPriceDenominator()`. Its units are therefore
     * `(token units / wei) * _tokenPriceDenominator()`.
     *
     * For a token priced from USD oracles, derive `tokenPrice` from the inverse exchange rate:
     *
     * `tokenPrice = (<Native token price in $> / 1e18) / (<ERC-20 token price in $> / 10**<ERC-20 decimals>) * _tokenPriceDenominator()`
     *
     * For example, suppose the token is USDC ($1 with 6 decimals) and the native currency is ETH ($2524.86 with 18 decimals).
     * Then 1 wei of gas costs `(2524.86 / 1e18) / (1 / 1e6) = 2.52486e-12` USDC units, so with
     * `_tokenPriceDenominator() = 1e18` we have `tokenPrice = 2_524_860` (i.e. `2.52486e-12 * 1e18`). Charging
     * `actualGasCost` wei yields `actualGasCost * 2_524_860 / 1e18` USDC units.
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

    /**
     * @dev Lower bound on `tokenPrice` (see {_fetchDetails} for units). Operations whose `tokenPrice`
     * is strictly below this value are rejected with `SIG_VALIDATION_FAILED` before {_prefund} runs.
     * Returning `0` disables the check.
     *
     * Example override for a USDC (6 decimals) paymaster refusing to sponsor below ETH = $100:
     *
     * ```solidity
     * function _minTokenPrice() internal view override returns (uint256) {
     *     return 100e6; // = 100 USDC/ETH * 10**6 USDC-units (1e18 denom cancels 1e18 wei/ETH)
     * }
     * ```
     */
    function _minTokenPrice() internal view virtual returns (uint256);

    /**
     * @dev Calculates native currency cost to ERC-20 token cost.
     *
     * Returns type(uint256).max if computation overflows.
     */
    function _erc20Cost(uint256 nativeCost, uint256 tokenPrice) internal view virtual returns (uint256) {
        uint256 denominator = _tokenPriceDenominator();
        (uint256 high, ) = nativeCost.mul512(tokenPrice);
        return high < denominator ? nativeCost.mulDiv(tokenPrice, denominator) : type(uint256).max;
    }

    /// @dev Internal function that allows the withdrawer to extract ERC-20 tokens resulting from gas payments.
    function _withdrawTokens(IERC20 token, address recipient, uint256 amount) internal virtual {
        if (amount == type(uint256).max) amount = token.balanceOf(address(this));
        token.safeTransfer(recipient, amount);
    }
}
