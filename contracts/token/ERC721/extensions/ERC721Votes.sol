// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./draft-ERC721Permit.sol";
import "../../../utils/math/Math.sol";
import "../../../utils/math/SafeCast.sol";
import "../../../utils/cryptography/ECDSA.sol";

abstract contract ERC721Votes is ERC721Permit {
   struct Checkpoint {
        uint32 fromBlock;
        uint224 weight;
    }

    bytes32 private constant _DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");
    /**
     * @dev defaultWeight: default weight proprty set for each individual token (can
     * be customized using setTokenWeight fn)
     */
    uint32 private defaultWeight = 1;
    mapping(address => address) private _delegates;
    /**
     * @dev tokenWeights: A mapping of each individual tokenId to it's weight (defualt = 1, 
     but can be modified using setTokenWeight fn)
     */
    mapping(uint256 => uint32) public tokenWeights;
     /**
     * @dev tokenStatus: A mapping of tokenIds to a bool value, noting if it has been customized
     (Designed specifically for informing getTokenWeight whether token has been customized)
     */
    mapping(uint256 => bool) private tokenStatus;
    mapping(address => Checkpoint[]) private _checkpoints;
    Checkpoint[] private _totalSupplyCheckpoints;
    
    /**
     * @dev Emitted when an account changes their delegate.
     */
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /**
     * @dev Emitted when a token transfer or delegate change results in changes to an account's voting power.
     */
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function checkpoints(address account, uint32 pos) public view virtual returns (Checkpoint memory) {
        return _checkpoints[account][pos];
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(address account) public view virtual returns (uint32) {
        return SafeCast.toUint32(_checkpoints[account].length);
    }

    /**
     * @dev Get the address `account` is currently delegating to.
     */
    function delegates(address account) public view virtual returns (address) {
        return _delegates[account];
    }

    /**
     * @dev Gets the current voting weight for `account`
     */
    function getUserVotes(address account) public view returns (uint256) {
      uint256 pos = _checkpoints[account].length;
      return pos == 0 ? 0 : _checkpoints[account][pos - 1].weight;
    }

    /**
     * @dev Enables the customization of specific token weights
     */
   function setTokenWeight(uint256 tokenId, uint32 weight) internal {
      tokenWeights[tokenId] = weight;
      tokenStatus[tokenId] = true;
    }

    /**
     * @dev Gets the token weight of a specific tokenId, defaults to 1 if tokenId weight hasn't been set 
     * Fn uses tokenStatus to determine if token weight has been customized
     */
    function getTokenWeight(uint256 tokenId) internal view returns(uint32) {
        return tokenStatus[tokenId] ? tokenWeights[tokenId] : defaultWeight;
    }

    /**
     * @dev Retrieve the number of votes for `account` at the end of `blockNumber`.
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getVotingWeight(address account, uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "ERC721Votes: block not yet mined");
        return _checkpointsLookup(_checkpoints[account], blockNumber);
    }

     /**
     * @dev Get total voting weight by accessing supply at a specific block
     */

    function totalTokenWeight() public view returns (uint256) {
      uint256 pos = _totalSupplyCheckpoints.length;
      return pos == 0 ? 0 : _totalSupplyCheckpoints[pos - 1].weight;
    }
    /**
     * @dev Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is but NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastTotalSupply(uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "ERC721Votes: block not yet mined");
        return _checkpointsLookup(_totalSupplyCheckpoints, blockNumber);
    }

    /**
     * @dev Lookup a value in a list of (sorted) checkpoints.
     */
    function _checkpointsLookup(Checkpoint[] storage ckpts, uint256 blockNumber) private view returns (uint256) {
        // We run a binary search to look for the earliest checkpoint taken after `blockNumber`.
        //
        // During the loop, the index of the wanted checkpoint remains in the range [low-1, high).
        // With each iteration, either `low` or `high` is moved towards the middle of the range to maintain the invariant.
        // - If the middle checkpoint is after `blockNumber`, we look in [low, mid)
        // - If the middle checkpoint is before or equal to `blockNumber`, we look in [mid+1, high)
        // Once we reach a single value (when low == high), we've found the right checkpoint at the index high-1, if not
        // out of bounds (in which case we're looking too far in the past and the result is 0).
        // Note that if the latest checkpoint available is exactly for `blockNumber`, we end up with an index that is
        // past the end of the array, so we technically don't find a checkpoint after `blockNumber`, but it works out
        // the same.
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
        return high == 0 ? 0 : ckpts[high - 1].weight;
    }

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual {
        return _delegate(_msgSender(), delegatee);
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
        return _delegate(signer, delegatee);
    }

    /**
     * @dev Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1).
     */
    function _maxTokenWeight() internal view virtual returns (uint224) {
        return type(uint224).max;
    }

    /**
     * @dev Snapshots the totalSupply after it has been increased. 
     * Fn requires that totalTokenWeight plus the token weight of the minted 
     * token is less than maxTokenWeight
     */
    function _mint(address account, uint256 tokenId) internal virtual override {
        super._mint(account, tokenId);
        
        uint256 updatedTokenWeight = _add(totalTokenWeight(), getTokenWeight(tokenId));
        uint256 tokenWeight = getTokenWeight(tokenId);

        require(updatedTokenWeight <= _maxTokenWeight(), "ERC721Votes: total token weight risks overflowing votes");

        _writeCheckpoint(_totalSupplyCheckpoints, _add, tokenWeight);
    }

    /**
     * @dev Snapshots the totalSupply after it has been decreased.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        uint256 tokenWeight = getTokenWeight(tokenId);

        _writeCheckpoint(_totalSupplyCheckpoints, _subtract, tokenWeight);
    }

    /**
     * @dev Move voting weight when tokens are transferred.
     *
     * Emits a {DelegateVotesChanged} event.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._afterTokenTransfer(from, to, tokenId);

        uint256 tokenWeight = getTokenWeight(tokenId);

        _moveVotingPower(delegates(from), delegates(to), tokenWeight);
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {DelegateChanged} and {DelegateVotesChanged}.
     */
    function _delegate(address delegator, address delegatee) internal virtual {
        address currentDelegate = delegates(delegator);
        uint256 delegatorBalance = balanceOf(delegator) * defaultWeight;
        _delegates[delegator] = delegatee;

        emit DelegateChanged(delegator, currentDelegate, delegatee);

        _moveVotingPower(currentDelegate, delegatee, delegatorBalance);
    }

    /**
     * @dev Moves voting power after voting weight is exchanged, either
     * through a _delegate transfer or a token transfer.
     *
     */
    function _moveVotingPower(
        address src,
        address dst,
        uint256 tokenWeight
    ) private {
        if (src != dst && tokenWeight > 0) {
            if (src != address(0)) {
                (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(_checkpoints[src], _subtract, tokenWeight);
                emit DelegateVotesChanged(src, oldWeight, newWeight);
            }

            if (dst != address(0)) {
                (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(_checkpoints[dst], _add, tokenWeight);
                emit DelegateVotesChanged(dst, oldWeight, newWeight);
            }
        }
    }

   /**
     * @dev Makes a new checkpoint, noting the block and the updated weight 
     * as a snapshot in time
     *
     */
    function _writeCheckpoint(
        Checkpoint[] storage ckpts,
        function(uint256, uint256) view returns (uint256) op,
        uint256 delta
    ) private returns (uint256 oldWeight, uint256 newWeight) {
        uint256 pos = ckpts.length;
        oldWeight = pos == 0 ? 0 : ckpts[pos - 1].weight;
        newWeight = op(oldWeight, delta);

        if (pos > 0 && ckpts[pos - 1].fromBlock == block.number) {
            ckpts[pos - 1].weight = SafeCast.toUint224(newWeight);
        } else {
            ckpts.push(Checkpoint({fromBlock: SafeCast.toUint32(block.number), weight: SafeCast.toUint224(newWeight)}));
        }
    }

    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }
}

