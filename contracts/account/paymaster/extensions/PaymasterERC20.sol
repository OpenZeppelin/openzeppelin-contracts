// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (account/paymaster/extensions/PaymasterERC20.sol)

pragma solidity ^0.8.20;

import {ERC4337Utils, PackedUserOperation} from "../../utils/ERC4337Utils.sol";
import {IERC20, SafeERC20} from "../../../token/ERC20/utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";
import {SafeCast} from "../../../utils/math/SafeCast.sol";
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
 * ) internal view override returns (uint256 validationData, IERC20 token, uint256 tokenPerNative) {
 *     // Implement logic to fetch the token, and token price from the userOp
 * }
 * ```
 *
 * The contract follows a pre-charge and refund model:
 * 1. During validation, it pre-charges the maximum possible gas cost
 * 2. After execution, it refunds any unused gas back to the user
 *
 * NOTE: {_prefund} performs a `transferFrom` during the validation phase, writing to the token contract's storage.
 * ERC-7562 restricts unstaked paymasters from such accesses, and public mempool bundlers will reject these operations.
 * Stake the paymaster (see {Paymaster-_addStake}) when deploying against a public mempool.
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
    using SafeCast for *;
    using SafeERC20 for IERC20;

    /**
     * @dev Emitted when a user operation identified by `userOpHash` is sponsored by this paymaster
     * using the specified ERC-20 `token`. The `tokenAmount` is the amount charged for the operation,
     * and `tokenPerNative` is the valuation of the token in units of token per native currency (e.g., ETH).
     */
    event UserOperationSponsored(
        bytes32 indexed userOpHash,
        address indexed token,
        uint256 tokenAmount,
        uint256 tokenPerNative
    );

    /**
     * @dev Thrown when the paymaster fails to refund the difference between the `prefundAmount`
     * and the `actualAmount` of `token`.
     */
    error PaymasterERC20FailedRefund(IERC20 token, uint256 prefundAmount, uint256 actualAmount, bytes prefundContext);

    /**
     * @dev See {Paymaster-_validatePaymasterUserOp}.
     *
     * Attempts to retrieve the `token` and `tokenPerNative` from the user operation (see {_fetchDetails})
     * and prefund the user operation using these values and the `maxCost` argument (see {_prefund}).
     *
     * Returns `abi.encodePacked(userOpHash, token, tokenPerNative, prefundAmount, prefunder, penaltyGas, prefundContext)`
     * in `context` if the prefund is successful. Otherwise, it returns empty bytes.
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal virtual override returns (bytes memory context, uint256 validationData) {
        IERC20 token;
        uint256 tokenPerNative;
        address userOpSender = userOp.sender;
        (validationData, token, tokenPerNative) = _fetchDetails(userOp, userOpHash);

        if (uint160(validationData) == ERC4337Utils.SIG_VALIDATION_FAILED || tokenPerNative < _minTokensPerNative())
            return (bytes(""), ERC4337Utils.SIG_VALIDATION_FAILED);

        // Worst-case unused-gas penalty that the EntryPoint may debit from the paymaster's deposit for the
        // user-controlled `paymasterPostOpGasLimit` (see {_postOpGasPenalty}). The EntryPoint computes this penalty
        // only after `postOp` returns, so it is absent from the `actualGasCost` reported to {_postOp}. We price it
        // into the charge here and retain it in {_postOp}, so a user cannot inflate `paymasterPostOpGasLimit` to
        // drain the paymaster's deposit.
        //
        // Only the part of the limit above {_postOpGasBudget} can go unused: the paymaster bills the budget in full
        // through {_postOpCost}, so charging a penalty on it would bill the sender twice for gas the paymaster
        // itself demanded.
        uint256 penaltyGas = _postOpGasPenalty(
            userOp.paymasterPostOpGasLimit().saturatingSub(_postOpGasBudget(userOp))
        );

        // If the _erc20Cost math fails, the returned value will be type(uint256).max, which we will never be able
        // to charge as a prefund. The `trySafeTransferFrom` in the `_prefund` will fail, causing success to be false.
        // Saturating arithmetic keeps an overflow in the native cost from wrapping: it saturates to
        // `type(uint256).max`, which `_erc20Cost` also returns, and fails the prefund instead of undercharging.
        //
        // native cost is computed as: maxCost + ((_postOpCost() + penaltyGas) * userOp.maxFeePerGas())
        uint256 maxTokenCost = _erc20Cost(
            _postOpCost().saturatingAdd(penaltyGas).saturatingMul(userOp.maxFeePerGas()).saturatingAdd(maxCost),
            tokenPerNative
        );
        (bool success, address prefunder, uint256 prefundAmount, bytes memory prefundContext) = _prefund(
            userOp,
            userOpHash,
            token,
            tokenPerNative,
            userOpSender,
            maxTokenCost
        );

        return
            success
                ? (
                    abi.encodePacked(
                        userOpHash,
                        token,
                        tokenPerNative,
                        prefundAmount,
                        prefunder,
                        penaltyGas,
                        prefundContext
                    ),
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
        uint256 /* tokenPerNative */,
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
     * IMPORTANT: A revert here does not revert the whole bundle: the user operation is marked as failed and
     * its execution rolled back, but the validation-phase prefund is not refunded. When a derived contract
     * delegates the prefund to a third party (e.g. a guarantor), that party must consent to the sender-controlled
     * `paymasterPostOpGasLimit` before authorizing, otherwise the sender can strand the third party's prefund by
     * picking a limit below the actual postOp cost.
     */
    function _postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal virtual override {
        bytes32 userOpHash = bytes32(context[0x00:0x20]);
        IERC20 token = IERC20(address(bytes20(context[0x20:0x34])));
        uint256 tokenPerNative = uint256(bytes32(context[0x34:0x54]));
        uint256 prefundAmount = uint256(bytes32(context[0x54:0x74]));
        address prefunder = address(bytes20(context[0x74:0x88]));
        uint256 penaltyGas = uint256(bytes32(context[0x88:0xA8]));
        bytes calldata prefundContext = context[0xA8:];

        // If the _erc20Cost math fails, the returned value will be type(uint256).max, which we will never be able
        // to charge as a refund. The `trySafeTransfer` in the `_refund` will fail, causing success to be false.
        // `penaltyGas` covers the EntryPoint's unused-gas penalty on `paymasterPostOpGasLimit`, which is excluded
        // from `actualGasCost` (the EntryPoint computes it only after `postOp` returns). See {_postOpGasPenalty}.
        //
        // native cost is computed as: actualGasCost + ((_postOpCost() + penaltyGas) * actualUserOpFeePerGas)
        uint256 actualTokenCost = _erc20Cost(
            _postOpCost().saturatingAdd(penaltyGas).saturatingMul(actualUserOpFeePerGas).saturatingAdd(actualGasCost),
            tokenPerNative
        );
        (bool success, uint256 actualAmount) = _refund(
            token,
            tokenPerNative,
            actualTokenCost,
            actualUserOpFeePerGas,
            prefunder,
            prefundAmount,
            prefundContext
        );
        if (!success) revert PaymasterERC20FailedRefund(token, prefundAmount, actualAmount, prefundContext);

        emit UserOperationSponsored(userOpHash, address(token), actualAmount, tokenPerNative);
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
        uint256 /* tokenPerNative */,
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
     * * `tokenPerNative`: Token units charged per unit of native currency. This is scaled by `_tokenPerNativeDenominator()`
     *    which defaults to 1e18 (wei per eth), making it effectively a number of token units per eth, and not per wei.
     *
     * ==== Calculating the token price
     *
     * `tokenPerNative` is the multiplier {_erc20Cost} applies to a native-currency gas cost to produce a token amount:
     * `tokenAmount = (nativeCost * tokenPerNative) / _tokenPerNativeDenominator()`. Each elements is denominated as follows:
     *
     * * `tokenAmount`: token units.
     * * `nativeCost`: wei.
     * * `tokenPerNative`: token units per eth.
     * * `_tokenPerNativeDenominator()`: wei per native coin (1e18 on EVM chains).
     *
     * For a token priced from USD oracles, derive `tokenPerNative` from the inverse exchange rate:
     *
     * `tokenPerNative = (<Native token price in $> / 1e18) / (<ERC-20 token price in $> / 10**<ERC-20 decimals>) * _tokenPerNativeDenominator()`
     *
     * For example, suppose the token is USDC ($1 with 6 decimals) and the native currency is ETH ($2524.86 with 18 decimals).
     * Then 1 wei of gas costs `(2524.86 / 1e18) / (1 / 1e6) = 2.52486e-9` USDC units, so with
     * `_tokenPerNativeDenominator() = 1e18` we have `tokenPerNative = 2_524_860_000` (i.e. `2.52486e-9 * 1e18`). Charging
     * `actualGasCost` wei yields `actualGasCost * 2_524_860_000 / 1e18` USDC units.
     */
    function _fetchDetails(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view virtual returns (uint256 validationData, IERC20 token, uint256 tokenPerNative);

    /**
     * @dev Over-estimates the cost of the post-operation logic, which the EntryPoint charges to the paymaster but
     * excludes from the `actualGasCost` reported to {_postOp}.
     *
     * NOTE: The default assumes a standard ERC-20. Override with a higher value for gas-heavier tokens; a persistent
     * underestimate drains the paymaster's deposit.
     *
     * NOTE: Extensions that bill extra postOp gas through a separate cost (rather than by widening this virtual)
     * must also widen {_postOpGasBudget} by the same amount, otherwise the extra gas is billed twice: once as cost
     * and once as unused-gas penalty.
     */
    function _postOpCost() internal view virtual returns (uint256) {
        return 30_000;
    }

    /**
     * @dev Portion of the user-controlled `paymasterPostOpGasLimit` that this paymaster already bills through
     * {_postOpCost}, and on which no unused-gas penalty is therefore charged (see {_postOpGasPenalty}).
     *
     * Extensions that bill extra postOp gas must widen this by the same amount, otherwise the gas they require the
     * sender to provision is billed twice: once as cost, once as penalty.
     *
     * IMPORTANT: The value returned here MUST NOT exceed the total postOp gas the paymaster bills. Combined with
     * {_postOpCost} over-estimating the gas `postOp` actually consumes, that keeps the charge computed in
     * {_validatePaymasterUserOp} above what the EntryPoint debits. A budget larger than what is billed under-prices
     * the penalty and settles operations at a loss.
     */
    function _postOpGasBudget(PackedUserOperation calldata /* userOp */) internal view virtual returns (uint256) {
        return _postOpCost();
    }

    /**
     * @dev Unused-gas penalty (in gas units) that the EntryPoint charges the paymaster's deposit, given
     * `unusedPostOpGas`: an upper bound on the part of `paymasterPostOpGasLimit` that `postOp` will leave unspent
     * (see {_postOpGasBudget}). This penalty is excluded from the `actualGasCost` reported to {_postOp} (the
     * EntryPoint computes it only after `postOp` returns), so it is priced into the charge during validation and
     * retained in {_postOp}. Without it, a user could inflate `paymasterPostOpGasLimit` and have the paymaster
     * absorb the resulting penalty on every operation, draining its deposit.
     *
     * The default mirrors the 10% penalty the EntryPoint (v0.7-v0.9) applies to unused postOp gas. It deliberately
     * does not reproduce the EntryPoint's 40_000 gas threshold below which no penalty applies: `unusedPostOpGas` is
     * an upper bound on the real unused amount, so claiming that relief here can price the charge below the penalty
     * the EntryPoint actually debits.
     *
     * NOTE: Overrides MUST return an upper bound on the real penalty, otherwise the paymaster settles operations at
     * a loss. Override to return 0 when targeting an EntryPoint that has no unused-gas penalty.
     */
    function _postOpGasPenalty(uint256 unusedPostOpGas) internal view virtual returns (uint256) {
        return unusedPostOpGas / 10;
    }

    /// @dev Denominator used for interpreting the `tokenPerNative` returned by {_fetchDetails} as "fixed point" in {_erc20Cost}.
    function _tokenPerNativeDenominator() internal view virtual returns (uint256) {
        return 1e18;
    }

    /**
     * @dev Lower bound on `tokenPerNative` (see {_fetchDetails} for units). Operations whose `tokenPerNative`
     * is strictly below this value are rejected with `SIG_VALIDATION_FAILED` before {_prefund} runs.
     *
     * To pick a value, decide:
     *
     * * `minCharge`: smallest token amount you want to bill per op (e.g. `0.01 USDC = 10_000` units).
     * * `minGasCost`: smallest `actualGasCost + _postOpCost() * actualUserOpFeePerGas` you expect, in wei
     *   (= `minGas * minFeePerGas`; `minFeePerGas` can be as low as 1 wei on some L2s).
     *
     * Then set `_minTokensPerNative() >= minCharge * _tokenPerNativeDenominator() / minGasCost`.
     *
     * Example: a USDC (6 decimals) paymaster on a chain with `minFeePerGas = 1 gwei`, sponsoring
     * ops of at least 100_000 gas and charging at least 0.01 USDC per op:
     *
     * ```solidity
     * function _minTokensPerNative() internal view override returns (uint256) {
     *     return 100e6; // = 1e4 (0.01 USDC) * 1e18 / 1e14 (100_000 gas * 1 gwei) = 100 USDC/ETH
     * }
     * ```
     *
     * WARNING: Setting `_minTokensPerNative()` below `minCharge * _tokenPerNativeDenominator() / minGasCost`
     * lets {_erc20Cost} round to zero or to dust for the cheapest ops the paymaster accepts,
     * sponsoring them at a low (or zero) price.
     */
    function _minTokensPerNative() internal view virtual returns (uint256) {
        return 0;
    }

    /**
     * @dev Calculates native currency cost to ERC-20 token cost.
     *
     * Returns `type(uint256).max` if computation overflows.
     */
    function _erc20Cost(uint256 nativeCost, uint256 tokenPerNative) internal view virtual returns (uint256) {
        uint256 denominator = _tokenPerNativeDenominator();
        (uint256 high, ) = nativeCost.mul512(tokenPerNative);
        // Round up using a saturating add to avoid possible overflow of the rounding.
        return
            high < denominator
                ? nativeCost.mulDiv(tokenPerNative, denominator).saturatingAdd(
                    (mulmod(nativeCost, tokenPerNative, denominator) > 0).toUint()
                )
                : type(uint256).max;
    }

    /// @dev Internal function that allows the withdrawer to extract ERC-20 tokens resulting from gas payments.
    function _withdrawTokens(IERC20 token, address recipient, uint256 amount) internal virtual {
        if (amount == type(uint256).max) amount = token.balanceOf(address(this));
        token.safeTransfer(recipient, amount);
    }
}
