// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/utils/SafeERC20.sol";
import "../utils/structs/Distribution.sol";
import "./PaymentSplitter.sol";

/**
 * @title MultiPaymentSplitter
 * @dev This contract allows to split Ether and ERC20 payments among a group of accounts. Asset senders do not need to
 * be aware that the splitting in this way, since it is handled transparently by the contract.
 *
 * The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
 * account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
 * an amount proportional to the percentage of total shares they were assigned.
 *
 * `PaymentSplitter` follows a _pull payment_ model. This means that payments are not automatically forwarded to the
 * accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
 * function.
 */
contract MultiPaymentSplitter is PaymentSplitter {
    using Distribution for Distribution.AddressToUintWithTotal;

    event PaymentReleased(IERC20 indexed asset, address to, uint256 amount);

    mapping(IERC20 => Distribution.AddressToUintWithTotal) private _released;

    /**
     * @dev Creates an instance of `PaymentSplitter` where each account in `payees` is assigned the number of shares at
     * the matching position in the `shares` array.
     *
     * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
     * duplicates in `payees`.
     */
    constructor(address[] memory payees, uint256[] memory shares_) payable PaymentSplitter(payees, shares_) {}

    /**
     * @dev Getter for the amount of `asset` tokens already released to a payee.
     */
    function released(IERC20 asset, address account) public view returns (uint256) {
        return _released[asset].getValue(account);
    }

    /**
     * @dev Getter for the total amount of `asset` tokens already released.
     */
    function totalReleased(IERC20 asset) public view returns (uint256) {
        return _released[asset].getTotal();
    }

    /**
     * @dev Triggers an ERC20 transfer to `account` of the amount of `asset` tokens they are owed, according to their
     * percentage of the total shares and their previous withdrawals.
     */
    function release(IERC20 asset, address payable account) public virtual {
        require(shares(account) > 0, "MultiPaymentSplitter: account has no shares");

        uint256 totalReceived = asset.balanceOf(address(this)) + totalReleased(asset);
        uint256 payment = (totalReceived * shares(account)) / totalShares() - _released[asset].getValue(account);

        require(payment != 0, "MultiPaymentSplitter: account is not due payment");

        _released[asset].add(account, payment);

        SafeERC20.safeTransfer(IERC20(asset), account, payment);
        emit PaymentReleased(asset, account, payment);
    }
}
