// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./draft-ERC20Permit.sol";
import "./IComp.sol";
import "../../../utils/math/Math.sol";
import "../../../utils/cryptography/ECDSA.sol";

/**
 * @dev Extension of the ERC20 token contract to support Compound's voting and delegation.
 *
 * This extensions keeps an history (snapshots) of each account's vote power. Vote power can be delegated either
 * by calling the {delegate} directly, or by providing a signature that can later be verified and processed using
 * {delegateFromBySig}. Voting power, can be checked through the public accessors {getCurrentVotes} and {getPriorVotes}.
 *
 * By default, delegation is disabled. This makes transfers cheaper. The downside is that it requires users to delegate
 * to themselves in order to activate snapshots and have their voting power snapshoted. Enabling self-delegation can
 * easily be done by overloading the {delegates} function. Keep in mind however that this will significantly increass
 * the base gas cost of transfers.
 *
 * _Available since v4.2._
 */
abstract contract ERC20Votes is IComp, ERC20Permit {
    bytes32 private constant _DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    mapping (address => address) private _delegates;
    mapping (address => Checkpoint[]) private _checkpoints;

    function checkpoints(address account, uint32 pos) external view virtual override returns (Checkpoint memory) {
        return _checkpoints[account][pos];
    }

    function numCheckpoints(address account) external view virtual override returns (uint32) {
        return uint32(_checkpoints[account].length);
    }

    /**
    * @dev Get the address `account` is currently delegating to.
    */
    function delegates(address account) public view virtual override returns (address) {
        return _delegates[account];
    }

    /**
     * @dev Example: This enables autodelegation, makes each transfer more expensive but doesn't require user to
     * delegate to themselves. Can be usefull for tokens useds exclusivelly for governance, such as voting wrappers of
     * pre-existing ERC20.
     */
    // function delegates(address account) public view override returns (address) {
    //     address delegatee = _delegates[account];
    //     return delegatee == address(0) ? account : delegatee;
    // }

    /**
     * @notice Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address account) external view override returns (uint256) {
        uint256 pos = _checkpoints[account].length;
        return pos == 0 ? 0 : _checkpoints[account][pos - 1].votes;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorVotes(address account, uint256 blockNumber) external view override returns (uint256) {
        require(blockNumber < block.number, "ERC20Votes::getPriorVotes: not yet determined");

        Checkpoint[] storage ckpts = _checkpoints[account];

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

        return low == 0 ? 0 : ckpts[low - 1].votes;
    }

    /**
    * @notice Delegate votes from the sender to `delegatee`
    * @param delegatee The address to delegate votes to
    */
    function delegate(address delegatee) public virtual override {
        return _delegate(_msgSender(), delegatee);
    }

    /**
     * @notice Delegates votes from signatory to `delegatee`
     * @param delegatee The address to delegate votes to
     * @param nonce The contract state required to match the signature
     * @param expiry The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function delegateFromBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)
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
          _checkpoints[delegatee][pos - 1].votes = uint224(newWeight); // TODO: test overflow ?
      } else {
          _checkpoints[delegatee].push(Checkpoint({
              fromBlock: uint32(block.number),
              votes: uint224(newWeight)
          }));
      }

      emit DelegateVotesChanged(delegatee, oldWeight, newWeight);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        _moveDelegates(delegates(from), delegates(to), amount);
    }
}
