// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/utils/SafeERC20.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";

/**
 * @title PaymentSplitter
 * @dev This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
 * that the Ether will be split in this way, since it is handled transparently by the contract.
 *
 * The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
 * account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
 * an amount proportional to the percentage of total shares they were assigned.
 *
 * `PaymentSplitter` follows a _pull payment_ model. This means that payments are not automatically forwarded to the
 * accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
 * function.
 */
contract PaymentSplitter is Context {
    event PayeeAdded(address account, uint256 shares);
    event PaymentReleased(address to, uint256 amount);
    event ERC20PaymentReleased(IERC20 indexed asset, address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);

    uint256 private _totalShares;
    uint256 private _totalReleased;

    mapping(address => uint256) private _shares;
    mapping(address => uint256) private _released;
    address[] private _payees;

    mapping(IERC20 => uint256) private _erc20TotalReleased;
    mapping(IERC20 => mapping(address => uint256)) private _erc20Released;

    /**
     * @dev Creates an instance of `PaymentSplitter` where each account in `payees` is assigned the number of shares at
     * the matching position in the `shares` array.
     *
     * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
     * duplicates in `payees`.
     */
    constructor(address[] memory payees, uint256[] memory shares_) payable {
        require(payees.length == shares_.length, "PaymentSplitter: payees and shares length mismatch");
        require(payees.length > 0, "PaymentSplitter: no payees");

        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee(payees[i], shares_[i]);
        }
    }

    /**
     * @dev The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
     * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
     * reliability of the events, and not the actual splitting of Ether.
     *
     * To learn more about this see the Solidity documentation for
     * https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
     * functions].
     */
    receive() external payable virtual {
        emit PaymentReceived(_msgSender(), msg.value);
    }

    /**
     * @dev Getter for the total shares held by payees.
     */
    function totalShares() public view returns (uint256) {
        return _totalShares;
    }

    /**
     * @dev Getter for the total amount of Ether already released.
     */
    function totalReleased() public view returns (uint256) {
        return _totalReleased;
    }

    /**
     * @dev Getter for the total amount of `asset` already released. `asset` can be the as the address of an ERC20
     * token, or address(0) for Ether.
     */
    function totalReleased(IERC20 asset) public view returns (uint256) {
        return address(asset) == address(0) ? _totalReleased : _erc20TotalReleased[asset];
    }

    /**
     * @dev Getter for the amount of shares held by an account.
     */
    function shares(address account) public view returns (uint256) {
        return _shares[account];
    }

    /**
     * @dev Getter for the amount of Ether already released to a payee.
     */
    function released(address account) public view returns (uint256) {
        return _released[account];
    }

    /**
     * @dev Getter for the amount of `asset already released to a payee. `asset` can be the as the address of an ERC20
     * token, or address(0) for Ether.
     */
    function released(IERC20 asset, address account) public view returns (uint256) {
        return address(asset) == address(0) ? _released[account] : _erc20Released[asset][account];
    }

    /**
     * @dev Getter for the address of the payee number `index`.
     */
    function payee(uint256 index) public view returns (address) {
        return _payees[index];
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
     * total shares and their previous withdrawals.
     */
    function release(address payable account) public virtual {
        release(IERC20(address(0)), account);
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of `asset` they are owed, according to their percentage of
     * the total shares and their previous withdrawals. `asset` can be the as the address of an ERC20 token, or
     * address(0) for Ether.
     */
    function release(IERC20 asset, address payable account) public virtual {
        require(_shares[account] > 0, "PaymentSplitter: account has no shares");

        uint256 totalReceived = _getBalance(asset) + totalReleased(asset);
        uint256 payment = (totalReceived * _shares[account]) / _totalShares - released(asset, account);

        require(payment != 0, "PaymentSplitter: account is not due payment");

        if (address(asset) == address(0)) {
            _released[account] += payment;
            _totalReleased += payment;
        } else {
            _erc20Released[asset][account] += payment;
            _erc20TotalReleased[asset] += payment;
        }

        _sendValue(asset, account, payment);

        if (address(asset) == address(0)) {
            emit PaymentReleased(account, payment);
        } else {
            emit ERC20PaymentReleased(asset, account, payment);
        }
    }

    function _getBalance(IERC20 asset) private view returns (uint256) {
        return address(asset) == address(0) ? address(this).balance : asset.balanceOf(address(this));
    }

    function _sendValue(
        IERC20 asset,
        address payable to,
        uint256 amount
    ) private {
        if (address(asset) == address(0)) {
            Address.sendValue(to, amount);
        } else {
            SafeERC20.safeTransfer(asset, to, amount);
        }
    }

    /**
     * @dev Add a new payee to the contract.
     * @param account The address of the payee to add.
     * @param shares_ The number of shares owned by the payee.
     */
    function _addPayee(address account, uint256 shares_) private {
        require(account != address(0), "PaymentSplitter: account is the zero address");
        require(shares_ > 0, "PaymentSplitter: shares are 0");
        require(_shares[account] == 0, "PaymentSplitter: account already has shares");

        _payees.push(account);
        _shares[account] = shares_;
        _totalShares = _totalShares + shares_;
        emit PayeeAdded(account, shares_);
    }
}
