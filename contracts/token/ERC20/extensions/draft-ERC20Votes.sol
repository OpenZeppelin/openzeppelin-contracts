// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./draft-ERC20Permit.sol";
import "./draft-IERC20Votes.sol";
import "../../../utils/math/Math.sol";
import "../../../utils/math/SafeCast.sol";
import "../../../utils/cryptography/ECDSA.sol";

/**
 * @dev Extension of the ERC20 token contract to support Compound's voting and delegation.
 *
 * This extensions keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the {delegate} directly, or by providing a signature that can later be verified and processed using
 * {delegateFromBySig}. Voting power can be checked through the public accessors {getCurrentVotes} and {getPriorVotes}.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it requires users to delegate
 * to themselves in order to activate checkpoints and have their voting power tracked. Enabling self-delegation can
 * easily be done by overriding the {delegates} function. Keep in mind however that this will significantly increase
 * the base gas cost of transfers.
 *
 * _Available since v4.2._
 */
abstract contract ERC20Votes is IERC20Votes, ERC20Permit {
    bytes32 private constant _DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    mapping (address => address) private _delegates;
    mapping (address => Checkpoint[]) private _checkpoints;

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function checkpoints(address account, uint32 pos) external view virtual override returns (Checkpoint memory) {
        return _checkpoints[account][pos];
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(address account) external view virtual override returns (uint32) {
        return SafeCast.toUint32(_checkpoints[account].length);
    }

    /**
     * @dev Get the address `account` is currently delegating to.
     */
    function delegates(address account) public view virtual override returns (address) {
        return _delegates[account];
    }

    /**
     * @dev Gets the current votes balance for `account`
     */
    function getCurrentVotes(address account) external view override returns (uint256) {
        uint256 pos = _checkpoints[account].length;
        return pos == 0 ? 0 : _checkpoints[account][pos - 1].votes;
    }

    /**
     * @dev Determine the number of votes for `account` at the begining of `blockNumber`.
     */
    function getPriorVotes(address account, uint256 blockNumber) external view override returns (uint256) {
        require(blockNumber < block.number, "ERC20Votes::getPriorVotes: not yet determined");

        Checkpoint[] storage ckpts = _checkpoints[account];

        // Property: low and high converge on the first (earliest) checkpoint that is AFTER (or equal) `blockNumber`.
        // - If all checkpoints are before `blockNumber`, low and high converge toward `ckpts.length`
        // - If all checkpoints are after `blockNumber`, low and high will converge toward `0`
        // - If there are no checkpoints, low = high = 0 = ckpts.length, and the 2 properties above do hold
        // At each iteration:
        // - If checkpoints[mid].fromBlock is equal or after `blockNumber`, we look in [low, mid] (mid is a candidate)
        // - If checkpoints[mid].fromBlock is before `blockNumber`, we look in [mid+1, high] (mid is not a candidate)
        // Once we have found the first checkpoint AFTER (or equal) `blockNumber`, we get the value at the beginning of
        // `blockNumber` by reading the checkpoint just before that. If there is no checkpoint before, then we return 0
        // (no value).
        uint256 high = ckpts.length;
        uint256 low = 0;
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (ckpts[mid].fromBlock > blockNumber) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        return high == 0 ? 0 : ckpts[high - 1].votes;
    }

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual override {
        return _delegate(_msgSender(), delegatee);
    }

    /**
     * @dev Delegates votes from signatory to `delegatee`
     */
    function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)
    public virtual override
    {
        require(block.timestamp <= expiry, "ERC20Votes::delegateBySig: signature expired");
        address signatory = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(
                _DELEGATION_TYPEHASH,
                delegatee,
                nonce,
                expiry
            ))),
            v, r, s
        );
        require(nonce == _useNonce(signatory), "ERC20Votes::delegateBySig: invalid nonce");
        return _delegate(signatory, delegatee);
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     */
    function _delegate(address delegator, address delegatee) internal virtual {
        address currentDelegate = delegates(delegator);
        uint256 delegatorBalance = balanceOf(delegator);
        _delegates[delegator] = delegatee;

        emit DelegateChanged(delegator, currentDelegate, delegatee);

        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }

    function _moveDelegates(address srcRep, address dstRep, uint256 amount) private {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint256 srcRepNum = _checkpoints[srcRep].length;
                uint256 srcRepOld = srcRepNum == 0 ? 0 : _checkpoints[srcRep][srcRepNum - 1].votes;
                uint256 srcRepNew = srcRepOld - amount;
                _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint256 dstRepNum = _checkpoints[dstRep].length;
                uint256 dstRepOld = dstRepNum == 0 ? 0 : _checkpoints[dstRep][dstRepNum - 1].votes;
                uint256 dstRepNew = dstRepOld + amount;
                _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

    function _writeCheckpoint(address delegatee, uint256 pos, uint256 oldWeight, uint256 newWeight) private {
      if (pos > 0 && _checkpoints[delegatee][pos - 1].fromBlock == block.number) {
          _checkpoints[delegatee][pos - 1].votes = SafeCast.toUint224(newWeight);
      } else {
          _checkpoints[delegatee].push(Checkpoint({
              fromBlock: SafeCast.toUint32(block.number),
              votes: SafeCast.toUint224(newWeight)
          }));
      }

      emit DelegateVotesChanged(delegatee, oldWeight, newWeight);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        _moveDelegates(delegates(from), delegates(to), amount);
    }
}
