// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/utils/VotesExtended.sol)
pragma solidity ^0.8.20;

import {Checkpoints} from "../../utils/structs/Checkpoints.sol";
import {Votes} from "./Votes.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import "./IMultiVotes.sol";

/**
 * @dev Extension of {Votes} with support for partial delegations.
 * You can give a fixed amount of voting power to each delegate and select one as `defaulted` using {Votes} methods
 * `defaulted` takes all of the remaining votes.
 *
 * NOTE: If inheriting from this contract there are things you should be carefull of
 * multiDelegates getter is considered possibily failing for out of gas if too many partial delegates are assigned
 * If you implement a limit for maximum delegates for each delegator, multiDelegates can be considered always working.
 */
abstract contract MultiVotes is Votes, IMultiVotes {

    bytes32 private constant MULTI_DELEGATION_TYPEHASH =
        keccak256("MultiDelegation(address[] delegatees,uint256[] units,uint256 nonce,uint256 expiry)");

    /**
     * NOTE: If you work directly with these mappings be careful.
     * Only _delegatesList is assured to have up to date and coherent data.
     * Values on _delegatesIndex and _delegatesUnits may be left dangling to save on gas.
     * So always use _accountHasDelegate() before giving trust to _delegatesIndex and _delegatesUnits values.
     */
    mapping(address account => address[]) private _delegatesList;
    mapping(address account => mapping(address delegatee => uint256)) private _delegatesIndex;
    mapping(address account => mapping(address delegatee => uint256)) private _delegatesUnits;

    mapping(address account => uint256) private _usedUnits;

    /**
     * @inheritdoc Votes
     */
    function _delegate(address account, address delegatee) internal override virtual {
        address oldDelegate = delegates(account);
        _setDelegate(account, delegatee);

        emit DelegateChanged(account, oldDelegate, delegatee);
        _moveDelegateVotes(oldDelegate, delegatee, getFreeUnits(account));
    }

    /**
     * @inheritdoc Votes
     */
    function _transferVotingUnits(address from, address to, uint256 amount) internal override virtual {
        if(from != address(0)) {
            uint256 freeUnits = getFreeUnits(from);
            require(amount <= freeUnits, MultiVotesExceededAvailableUnits(amount, freeUnits));
        }
        super._transferVotingUnits(from, to, amount);
    }

    /**
     * @dev Returns `account` partial delegations.
     *
     * NOTE: Without a limit on partial delegations applyed, this call may consume too much gas and fail.
     * Furthermore consider received list order pseudo-random
     */
    function multiDelegates(address account) public view virtual returns (address[] memory) {
        return _delegatesList[account];
    }

    /**
     * @dev Set delegates list with units assigned for each one
     */
    function multiDelegate(address[] calldata delegatees, uint256[] calldata units) public virtual {
        address account = _msgSender();
        _multiDelegate(account, delegatees, units);
    }

    /**
     * @dev Multi delegate votes from signer to `delegatees`.
     */
    function multiDelegateBySig(
        address[] calldata delegatees,
        uint256[] calldata units, 
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        if (block.timestamp > expiry) {
            revert VotesExpiredSignature(expiry);
        }

        bytes32 delegatesHash = keccak256(abi.encodePacked(delegatees));
        bytes32 unitsHash = keccak256(abi.encodePacked(units));
        bytes32 structHash = keccak256(
            abi.encode(
                MULTI_DELEGATION_TYPEHASH,
                delegatesHash,
                unitsHash,
                nonce,
                expiry
            )
        );

        address signer = ECDSA.recover(
            _hashTypedDataV4(structHash),
            v, r, s
        );

        _useCheckedNonce(signer, nonce);
        _multiDelegate(signer, delegatees, units);
    }
    
    /**
     * @dev Add delegates to the multi delegation list or modify units of already exhisting.
     *
     * Emits multiple events {IMultiVotes-DelegateAdded} and {IMultiVotes-DelegateModified}.
     */
    function _multiDelegate(address account, address[] calldata delegatees, uint256[] calldata unitsList) internal virtual {
        require(delegatees.length == unitsList.length, MultiVotesDelegatesAndUnitsMismatch(delegatees.length, unitsList.length));
        require(delegatees.length > 0, MultiVotesNoDelegatesGiven());

        uint256 givenUnits;
        uint256 removedUnits;
        for(uint256 i; i < delegatees.length; i++) {
            address delegatee = delegatees[i];
            uint256 units = unitsList[i];

            if(units != 0) {
                if(_accountHasDelegate(account, delegatee)) {
                    (uint256 difference, bool refunded) = _modifyDelegate(account, delegatee, units);
                    refunded ? givenUnits += difference : removedUnits += difference;
                    continue;
                }

                _addDelegate(account, delegatee, units);
                givenUnits += units;
            } else {
                removedUnits += _removeDelegate(account, delegatee); 
            }          
        }
        
        if(removedUnits >= givenUnits) {
            uint256 refundedUnits;
            refundedUnits = removedUnits - givenUnits;
            /**
             * Cannot Underflow: code logic assures that _usedUnits[account] is just a sum of active delegates units
             * and that every units change of delegate on `account`, updates coherently _usedUnits
             * so refundedUnits cannot be higher than _usedUnits[account]
             */
            unchecked {
                _usedUnits[account] -= refundedUnits;
            }
            _moveDelegateVotes(address(0), delegates(account), refundedUnits);
        } else {
            uint256 addedUnits = givenUnits - removedUnits;
            uint256 availableUnits = getFreeUnits(account);
            require(availableUnits >= addedUnits, MultiVotesExceededAvailableUnits(addedUnits, availableUnits));

            _usedUnits[account] += addedUnits;
            _moveDelegateVotes(delegates(account), address(0), addedUnits);
        }
        
    }

    /**
     * @dev Helper for _multiDelegate that adds a delegate to multi delegations.
     *
     * Emits event {IMultiVotes-DelegateModified}.
     *
     * NOTE: this function does not automatically update _usedUnits and should never receive 0 `units` value
     */
    function _addDelegate(address account, address delegatee, uint256 units) private {
        _delegatesUnits[account][delegatee] = units;
        _delegatesIndex[account][delegatee] = _delegatesList[account].length;
        _delegatesList[account].push(delegatee);
        emit DelegateModified(account, delegatee, 0, units);

        _moveDelegateVotes(address(0), delegatee, units);
    }

    /**
     * @dev Helper for _multiDelegate to modify a specific delegate. Returns difference and if it's refunded units.
     *
     * Emits event {IMultiVotes-DelegateModified}.
     *
     * NOTE: this function does not automatically update _usedUnits and should never receive 0 `units` value
     */
    function _modifyDelegate(
        address account,
        address delegatee,
        uint256 units
    ) private returns (uint256 difference, bool refunded) {
        uint256 oldUnits = _delegatesUnits[account][delegatee];

        if(oldUnits == units) return (0, false);
                
        if(oldUnits > units) {
            difference = oldUnits - units;
            _moveDelegateVotes(delegatee, address(0), difference);
        } else {
            difference = units - oldUnits;
            _moveDelegateVotes(address(0), delegatee, difference);
            refunded = true;
        }

        _delegatesUnits[account][delegatee] = units;
        emit DelegateModified(account, delegatee, oldUnits, units);
        return (difference, refunded);
    }

    /**
     * @dev Helper for _multiDelegate to remove a delegate from multi delegations list. Returns removed units.
     *
     * Emits event {IMultiVotes-DelegateModified}.
     *
     * NOTE: this function does not automatically update _usedUnits
     */
    function _removeDelegate(address account, address delegatee) private returns (uint256) {
        if(!_accountHasDelegate(account, delegatee)) return 0;

        uint256 delegateIndex = _delegatesIndex[account][delegatee];
        uint256 lastDelegateIndex = _delegatesList[account].length-1;
        address lastDelegate = _delegatesList[account][lastDelegateIndex];
        uint256 refundedUnits = _delegatesUnits[account][delegatee];

        _delegatesList[account][delegateIndex] = lastDelegate;
        _delegatesIndex[account][lastDelegate] = delegateIndex;
        _delegatesList[account].pop();
        emit DelegateModified(account, delegatee, refundedUnits, 0);

        _moveDelegateVotes(delegatee, address(0), refundedUnits);
        return refundedUnits;
    }

    /**
     * @dev Returns number of units a partial delegate of `account` has.
     *
     * NOTE: This function returns only the partial delegation value, defaulted units are not counted
     */
    function getDelegatedUnits(address account, address delegatee) public view virtual returns (uint256) {
        if(!_accountHasDelegate(account, delegatee)) {
            return 0;
        }
        return _delegatesUnits[account][delegatee];
    }

    /**
     * @dev Returns number of unassigned units that `account` has. Free units are assigned to the Votes single delegate selected.
     */
    function getFreeUnits(address account) public view virtual returns (uint256) {
        return _getVotingUnits(account) - _usedUnits[account];
    }
    
    /**
     * @dev Returns true if account has a specific delegate.
     *
     * NOTE: This works only assuming that everytime a value is added to _delegatesList
     * _delegatesUnits and _delegatesIndex are updated.
     */
    function _accountHasDelegate(address account, address delegatee) internal view virtual returns (bool) {
        uint256 delegateIndex = _delegatesIndex[account][delegatee];

        if(_delegatesList[account].length <= delegateIndex) {
            return false;
        }

        if(delegatee == _delegatesList[account][delegateIndex]) {
            return true;
        } else {
            return false;
        }
    }
    
}
