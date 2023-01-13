// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (governance/utils/Votes.sol)
pragma solidity ^0.8.0;

import "../../utils/Context.sol";
import "../../utils/Nonces.sol";
import "../../utils/Checkpoints.sol";
import "../../utils/cryptography/EIP712.sol";
import "./IVotesMulti.sol";
import "../../utils/math/SafeCast.sol";

/**
 * @dev This is a base abstract contract that tracks voting units, which are a measure of voting power that can be
 * transferred, and provides a system of vote delegation, where an account can delegate its voting units to a sort of
 * "representative" that will pool delegated voting units from different accounts and can then use it to vote in
 * decisions. In fact, voting units _must_ be delegated in order to count as actual votes, and an account has to
 * delegate those votes to itself if it wishes to participate in decisions and does not have a trusted representative.
 *
 * This contract is often combined with a token contract such that voting units correspond to token units. For an
 * example, see {ERC721Votes}.
 *
 * The full history of delegate votes is tracked on-chain so that governance protocols can consider votes as distributed
 * at a particular block number to protect against flash loans and double voting. The opt-in delegate system makes the
 * cost of this history tracking optional.
 *
 * When using this module the derived contract must implement {_getVotingUnits} (for example, make it return
 * {ERC721-balanceOf}), and can use {_transferVotingUnits} to track a change in the distribution of those units (in the
 * previous example, it would be included in {ERC721-_beforeTokenTransfer}).
 *
 * _Available since v4.5._
 */
abstract contract VotesMulti is IVotesMulti, Context, EIP712, Nonces {
    using Checkpoints for Checkpoints.History;

    bytes32 private constant _DELEGATION_TYPEHASH =
        keccak256("Delegation(uint256 id,address delegatee,uint256 nonce,uint256 expiry)");

    mapping(address => mapping(uint256 => address)) private _delegation;
    mapping(address => mapping(uint256 => Checkpoints.History)) private _delegateCheckpoints;
    mapping(uint256 => Checkpoints.History) private _totalCheckpoints;

    /**
     * @dev Returns the current amount of votes that `account` has.
     */
    function getVotes(address account, uint256 id) public view virtual override returns (uint256) {
        return _delegateCheckpoints[account][id].latest();
    }

    /**
     * @dev Returns the amount of votes that `account` had at the end of a past block (`blockNumber`).
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastVotes(
        address account,
        uint256 id,
        uint256 blockNumber
    ) public view virtual override returns (uint256) {
        return _delegateCheckpoints[account][id].getAtProbablyRecentBlock(blockNumber);
    }

    /**
     * @dev Returns the total supply of votes available at the end of a past block (`blockNumber`).
     *
     * NOTE: This value is the sum of all available votes, which is not necessarily the sum of all delegated votes.
     * Votes that have not been delegated are still part of total supply, even though they would not participate in a
     * vote.
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastTotalSupply(uint256 id, uint256 blockNumber) public view virtual override returns (uint256) {
        require(blockNumber < block.number, "Votes: block not yet mined");
        return _totalCheckpoints[id].getAtProbablyRecentBlock(blockNumber);
    }

    /**
     * @dev Returns the current total supply of votes.
     */
    function _getTotalSupply(uint256 id) internal view virtual returns (uint256) {
        return _totalCheckpoints[id].latest();
    }

    /**
     * @dev Returns the delegate that `account` has chosen.
     */
    function delegates(address account, uint256 id) public view virtual override returns (address) {
        return _delegation[account][id];
    }

    /**
     * @dev Delegates votes from the sender to `delegatee`.
     */
    function delegate(uint256 id, address delegatee) public virtual override {
        address account = _msgSender();
        _delegate(account, id, delegatee);
    }

    /**
     * @dev Delegates votes from signer to `delegatee`.
     */
    function delegateBySig(
        uint256 id,
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        require(block.timestamp <= expiry, "Votes: signature expired");
        address signer = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(_DELEGATION_TYPEHASH, id, delegatee, nonce, expiry))),
            v,
            r,
            s
        );
        require(nonce == _useNonce(signer), "Votes: invalid nonce");
        _delegate(signer, id, delegatee);
    }

    /**
     * @dev Delegate all of `account`'s voting units to `delegatee`.
     *
     * Emits events {IVotes-DelegateChanged} and {IVotes-DelegateVotesChanged}.
     */
    function _delegate(
        address account,
        uint256 id,
        address delegatee
    ) internal virtual {
        address oldDelegate = delegates(account, id);
        _delegation[account][id] = delegatee;

        emit DelegateChanged(account, id, oldDelegate, delegatee);
        _moveDelegateVotes(oldDelegate, delegatee, id, _getVotingUnits(account, id));
    }

    /**
     * @dev Transfers, mints, or burns voting units. To register a mint, `from` should be zero. To register a burn, `to`
     * should be zero. Total supply of voting units will be adjusted with mints and burns.
     */
    function _transferVotingUnits(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual {
        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                _totalCheckpoints[ids[i]].push(_add, amounts[i]);
            }
        }
        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                _totalCheckpoints[ids[i]].push(_subtract, amounts[i]);
            }
        }
        for (uint256 i = 0; i < ids.length; i++) {
            _moveDelegateVotes(delegates(from, ids[i]), delegates(to, ids[i]), ids[i], amounts[i]);
        }
    }

    /**
     * @dev Moves delegated votes from one delegate to another.
     */
    function _moveDelegateVotes(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) private {
        if (from != to && amount > 0) {
            if (from != address(0)) {
                (uint256 oldValue, uint256 newValue) = _delegateCheckpoints[from][id].push(_subtract, amount);
                emit DelegateVotesChanged(from, id, oldValue, newValue);
            }
            if (to != address(0)) {
                (uint256 oldValue, uint256 newValue) = _delegateCheckpoints[to][id].push(_add, amount);
                emit DelegateVotesChanged(to, id, oldValue, newValue);
            }
        }
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function _numCheckpoints(address account, uint256 id) internal view virtual returns (uint32) {
        return SafeCast.toUint32(_delegateCheckpoints[account][id].length());
    }

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function _checkpoints(
        address account,
        uint256 id,
        uint32 pos
    ) internal view virtual returns (Checkpoints.Checkpoint memory) {
        return _delegateCheckpoints[account][id].getAtPosition(pos);
    }

    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the contract's {EIP712} domain separator.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view virtual returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Must return the voting units held by an account.
     */
    function _getVotingUnits(address, uint256) internal view virtual returns (uint256);
}
