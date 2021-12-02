// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Counters.sol";
import "./Checkpoints.sol";
import "./cryptography/draft-EIP712.sol";

/**
 * @dev Voting operations.
 */
abstract contract Votes is EIP712 {
    using Checkpoints for Checkpoints.History;
    using Counters for Counters.Counter;

    bytes32 private constant _DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");
    mapping(address => address) _delegation;
    mapping(address => Checkpoints.History) _userCheckpoints;
    mapping(address => Counters.Counter) private _nonces;
    Checkpoints.History _totalCheckpoints;

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
    function getVotes(address account) public view returns (uint256) {
        return _userCheckpoints[account].latest();
    }

    /**
     * @dev Returns total amount of votes at given position.
     */
    function _getPastVotes(
        address account,
        uint256 timestamp
    ) internal view returns (uint256) {
        return _userCheckpoints[account].past(timestamp);
    }

    /**
     * @dev Retrieve the `totalVotingPower` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is but NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastTotalSupply(uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "ERC721Votes: block not yet mined");
        return _totalCheckpoints.past(blockNumber);
    }

    /**
     * @dev Get checkpoint for `account` for specific position.
     */
    function _getTotalAccountVotesAt(
        address account,
        uint32 pos
    ) internal view returns (Checkpoints.Checkpoint memory) {
        return _userCheckpoints[account].at(pos);
    }

    /**
     * @dev Returns total amount of votes.
     */
    function _getTotalVotes() internal view returns (uint256) {
        return _totalCheckpoints.latest();
    }

    /**
     * @dev Get number of checkpoints for `account` including delegation.
     */
    function _getTotalAccountVotes(address account) internal view returns (uint256) {
        return _userCheckpoints[account].length();
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {DelegateChanged} and {DelegateVotesChanged}.
     */
    function _delegate(address delegator, address delegatee) internal virtual {
        emit DelegateChanged(delegator, delegates(delegator), delegatee);
        _delegate(delegator, delegatee, _getDelegatorVotes(delegator));
    }

    /**
     * @dev Returns account delegation.
     */
    function delegates(address account) public view returns (address) {
        return _delegation[account];
    }

    /**
     * @dev Delegates voting power.
     */
    function _delegate(
        address account,
        address newDelegation,
        uint256 balance
    ) internal {
        address oldDelegation = delegates(account);
        _delegation[account] = newDelegation;

        emit DelegateChanged(account, oldDelegation, newDelegation);

        _moveVotingPower(oldDelegation, newDelegation, balance);
    }

    /**
     * @dev Moves voting power.
     */
    function _moveVotingPower(
        address src,
        address dst,
        uint256 amount
    ) internal {
        if (src != dst && amount > 0) {
            if (src != address(0)) {
                _totalCheckpoints.push(_subtract, amount);
                (uint256 oldValue, uint256 newValue) = _userCheckpoints[src].push(_subtract, amount);
                emit DelegateVotesChanged(src, oldValue, newValue);
            }
            if (dst != address(0)) {
                _totalCheckpoints.push(_add, amount);
                (uint256 oldValue, uint256 newValue) = _userCheckpoints[dst].push(_add, amount);
                emit DelegateVotesChanged(dst, oldValue, newValue);
            }
        }
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
        _delegate(signer, delegatee);
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
    function _getDelegatorVotes(address) internal virtual returns(uint256);
}
