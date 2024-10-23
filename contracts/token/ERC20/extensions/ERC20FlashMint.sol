// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/extensions/ERC20FlashMint.sol)

pragma solidity ^0.8.20;

import {IERC3156FlashBorrower} from "../../../interfaces/IERC3156FlashBorrower.sol";
import {IERC3156FlashLender} from "../../../interfaces/IERC3156FlashLender.sol";
import {ERC20} from "../ERC20.sol";

/**
 * @dev Implementation of the ERC-3156 Flash loans extension, as defined in
 * https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].
 *
 * Adds the {flashLoan} method, which provides flash loan support at the token
 * level. By default there is no fee, but this can be changed by overriding {flashFee}.
 *
 * NOTE: When this extension is used along with the {ERC20Capped} or {ERC20Votes} extensions,
 * {maxFlashLoan} will not correctly reflect the maximum that can be flash minted. We recommend
 * overriding {maxFlashLoan} so that it correctly reflects the supply cap.
 */
abstract contract ERC20FlashMint is ERC20, IERC3156FlashLender {
    bytes32 private constant RETURN_VALUE = keccak256("ERC3156FlashBorrower.onFlashLoan");

    /**
     * @dev The loan token is not valid.
     */
    error ERC3156UnsupportedToken(address token);

    /**
     * @dev The requested loan exceeds the max loan value for `token`.
     */
    error ERC3156ExceededMaxLoan(uint256 maxLoan);

    /**
     * @dev The receiver of a flashloan is not a valid {IERC3156FlashBorrower-onFlashLoan} implementer.
     */
    error ERC3156InvalidReceiver(address receiver);

    /**
     * @dev Returns the maximum amount of tokens available for loan.
     * @param token The address of the token that is requested.
     * @return The amount of token that can be loaned.
     *
     * NOTE: This function does not consider any form of supply cap, so in case
     * it's used in a token with a cap like {ERC20Capped}, make sure to override this
     * function to integrate the cap instead of `type(uint256).max`.
     */
    function maxFlashLoan(address token) public view virtual returns (uint256) {
        return token == address(this) ? type(uint256).max - totalSupply() : 0;
    }

    /**
     * @dev Returns the fee applied when doing flash loans. This function calls
     * the {_flashFee} function which returns the fee applied when doing flash
     * loans.
     * @param token The token to be flash loaned.
     * @param value The amount of tokens to be loaned.
     * @return The fees applied to the corresponding flash loan.
     */
    function flashFee(address token, uint256 value) public view virtual returns (uint256) {
        if (token != address(this)) {
            revert ERC3156UnsupportedToken(token);
        }
        return _flashFee(token, value);
    }

    /**
     * @dev Returns the fee applied when doing flash loans. By default this
     * implementation has 0 fees. This function can be overloaded to make
     * the flash loan mechanism deflationary.
     * @param token The token to be flash loaned.
     * @param value The amount of tokens to be loaned.
     * @return The fees applied to the corresponding flash loan.
     */
    function _flashFee(address token, uint256 value) internal view virtual returns (uint256) {
        // silence warning about unused variable without the addition of bytecode.
        token;
        value;
        return 0;
    }

    /**
     * @dev Returns the receiver address of the flash fee. By default this
     * implementation returns the address(0) which means the fee amount will be burnt.
     * This function can be overloaded to change the fee receiver.
     * @return The address for which the flash fee will be sent to.
     */
    function _flashFeeReceiver() internal view virtual returns (address) {
        return address(0);
    }

    /**
     * @dev Performs a flash loan. New tokens are minted and sent to the
     * `receiver`, who is required to implement the {IERC3156FlashBorrower}
     * interface. By the end of the flash loan, the receiver is expected to own
     * value + fee tokens and have them approved back to the token contract itself so
     * they can be burned.
     * @param receiver The receiver of the flash loan. Should implement the
     * {IERC3156FlashBorrower-onFlashLoan} interface.
     * @param token The token to be flash loaned. Only `address(this)` is
     * supported.
     * @param value The amount of tokens to be loaned.
     * @param data An arbitrary datafield that is passed to the receiver.
     * @return `true` if the flash loan was successful.
     */
    // This function can reenter, but it doesn't pose a risk because it always preserves the property that the amount
    // minted at the beginning is always recovered and burned at the end, or else the entire function will revert.
    // slither-disable-next-line reentrancy-no-eth
    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 value,
        bytes calldata data
    ) public virtual returns (bool) {
        uint256 maxLoan = maxFlashLoan(token);
        if (value > maxLoan) {
            revert ERC3156ExceededMaxLoan(maxLoan);
        }
        uint256 fee = flashFee(token, value);
        _mint(address(receiver), value);
        if (receiver.onFlashLoan(_msgSender(), token, value, fee, data) != RETURN_VALUE) {
            revert ERC3156InvalidReceiver(address(receiver));
        }
        address flashFeeReceiver = _flashFeeReceiver();
        _spendAllowance(address(receiver), address(this), value + fee);
        if (fee == 0 || flashFeeReceiver == address(0)) {
            _burn(address(receiver), value + fee);
        } else {
            _burn(address(receiver), value);
            _transfer(address(receiver), flashFeeReceiver, fee);
        }
        return true;
    }
}
