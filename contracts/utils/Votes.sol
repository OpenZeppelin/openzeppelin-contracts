// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Context.sol";
import "./Counters.sol";
import "./Checkpoints.sol";
import "./cryptography/draft-EIP712.sol";

/**
 * @dev Voting operations.
 *
 * This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
 * power can be queried through {getVotes}.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
 * requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
 * Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
 * will significantly increase the base gas cost of transfers.
 *
 * When using this module, the derived contract must implement {_getDelegatorVotes}, and can use {_moveVotingPower}
 * when a delegator's voting power is changed.
 */
abstract contract Votes is Context, EIP712 {
    using Checkpoints for Checkpoints.History;
    using Counters for Counters.Counter;

    bytes32 private constant _DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");
    mapping(address => address) private _delegation;
    mapping(address => Checkpoints.History) private _userCheckpoints;
    mapping(address => Counters.Counter) private _nonces;
    Checkpoints.History private _totalCheckpoints;

    /**
     * @dev Emitted when an account changes their delegate.
     */
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /**
     * @dev Emitted when a token transfer or delegate change results in changes to an account's voting power.
     */
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    /**
     * @dev Returns total amount of votes for account.
     */
    function getVotes(address account) public view virtual returns (uint256) {
        return _userCheckpoints[account].latest();
    }

    /**
     * @dev Returns total amount of votes at given blockNumber.
     */
    function getPastVotes(address account, uint256 blockNumber) public view virtual returns (uint256) {
        return _userCheckpoints[account].getAtBlock(blockNumber);
    }

    /**
     * @dev Retrieve the `totalVotingPower` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is but NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastTotalSupply(uint256 blockNumber) public view virtual returns (uint256) {
        require(blockNumber < block.number, "ERC721Votes: block not yet mined");
        return _totalCheckpoints.getAtBlock(blockNumber);
    }

    /**
     * @dev Returns total amount of votes.
     */
    function _getTotalVotes() internal view virtual returns (uint256) {
        return _totalCheckpoints.latest();
    }

    /**
     * @dev Get number of checkpoints for `account` including delegation.
     */
    function _getTotalAccountVotes(address account) internal view virtual returns (uint256) {
        return _userCheckpoints[account].length();
    }

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual {
        address delegator = _msgSender();
        _delegate(delegator, delegatee, _getDelegatorVotes(delegator));
    }

    /**
     * @dev Returns account delegation.
     */
    function delegates(address account) public view virtual returns (address) {
        return _delegation[account];
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {DelegateChanged} and {DelegateVotesChanged}.
     */
    function _delegate(
        address account,
        address newDelegation,
        uint256 balance
    ) internal virtual{
        address oldDelegation = delegates(account);
        _delegation[account] = newDelegation;

        emit DelegateChanged(account, oldDelegation, newDelegation);

        _moveVotingPower(oldDelegation, newDelegation, balance);
    }

    /**
    * @dev Delegates votes from signer to `delegatee`
    */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        require(block.timestamp <= expiry, "ERC721Votes: signature expired");
        address signer = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(_DELEGATION_TYPEHASH, delegatee, nonce, expiry))),
            v,
            r,
            s
        );
        require(nonce == _useNonce(signer), "ERC721Votes: invalid nonce");
        _delegate(signer, delegatee, _getDelegatorVotes(signer));
    }

    /**
     * @dev Moves voting power.
     */
    function _moveVotingPower(
        address from,
        address to,
        uint256 amount
    ) internal virtual{
        if (from != to && amount > 0) {
            if (to == address(0) && from != address(0)) {
                _totalCheckpoints.push(_subtract, amount);
            } else if (from == address(0) && to != address(0)) {
                _totalCheckpoints.push(_add, amount);
            }

            if (from != address(0)) {
                (uint256 oldValue, uint256 newValue) = _userCheckpoints[from].push(_subtract, amount);
                emit DelegateVotesChanged(from, oldValue, newValue);
            }
            if (to != address(0)) {
                (uint256 oldValue, uint256 newValue) = _userCheckpoints[to].push(_add, amount);
                emit DelegateVotesChanged(to, oldValue, newValue);
            }
        }
    }

    /**
     * @dev Adds two numbers.
     */
    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Subtracts two numbers.
     */
    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev "Consume a nonce": return the current value and increment.
     *
     * _Available since v4.1._
     */
    function _useNonce(address owner) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }

    /**
     * @dev Returns an address nonce.
     */
    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner].current();
    }

    /**
     * @dev Returns DOMAIN_SEPARATOR.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Returns the balance of the delegator account
     */
    function _getDelegatorVotes(address) internal virtual returns (uint256);
}
