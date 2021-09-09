// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of the Multiparty contract standard.
 * This contract standard can be used if a smart contract has to be managed
 * in a democratic & secure way by a group of people.
 */
interface IMultiParty {
    /**
     * @dev Returns the total members in the group.
     */
    function totalMembers() external view returns (uint256);

    /**
     * @dev Returns if the given `member` is a member of the group.
     */
    function isMember(address member) external view returns (bool);

    /**
     * @dev Create an action/proposal which is open for approval for all members of the group.
     * An action consists of one or more methods that have to be executed once it's approved.
     * Only an existing member can create an action.
     *
     * Returns the `actionId` of the created action.
     *
     * Emits an {ActionStateChanged} event.
     */
    function createAction(bytes4[] memory methods, bytes[] memory args) external returns (uint256 actionId);

    /**
     * @dev Returns the details of an already created action/proposal given by `actionId`
     * which is open for approval for all members of the group.
     *
     */
    function getActionInfo(uint256 actionId)
        external
        view
        returns (
            bytes4[] memory methods,
            bytes[] memory args,
            uint256 state
        );

    /**
     * @dev Allows an existing `member` of the group to approve/reject an already created action/proposal given by `actionId`
     * which is open for approval for all members of the group.
     *
     * Emits an {ActionStateChanged} event.
     */
    function approveAction(uint256 actionId, bool approved) external returns (bool);

    /**
     * @dev Returns true if an action with given `actionId` is approved by `member` of the group.
     *
     */
    function isActionApprovedByUser(uint256 actionId, address member) external view returns (bool);

    /**
     * @dev Returns true if an action with given `actionId` is approved by all existing members of the group.
     * It’s up to the contract creators to decide if this method should look at majority votes (based on ownership)
     * or if it should ask consent of all the users irrespective of their ownerships.
     *
     */
    function isActionApproved(uint256 actionId) external view returns (bool);

    /**
     * @dev Executes the action referenced by the given `actionId` as long as it is approved by all existing members of the group.
     * The executeAction executes all methods as part of given action in an atomic way (either all should succeed or none should succeed).
     * Once executed, the action should be set as executed (state=3) so that it cannot be executed again.
     *
     * Emits an {ActionStateChanged} event.
     */
    function executeAction(uint256 actionId) external returns (bool);

    /**
     * @dev Allows existing members of the group to add a new `member` to the group.
     * This method should be public with `onlySelf` modifier and will be executed only if it's approved by the group.
     * (Approval is defined by the `isActionApproved` method)
     *
     */
    function addMember(address member) external returns (bool);

    /**
     * @dev Allows existing members of the group to remove an already existing `member` from the group.
     * This method should be public with `onlySelf` modifier and will be executed only if it's approved by the group.
     * (Approval is defined by the `isActionApproved` method)
     *
     */
    function removeMember(address member) external returns (bool);

    /**
     * @dev Transfers `value` amount of ETH to address `to`.
     * This method should be public with `onlySelf` modifier and will be executed only if it's approved by the group.
     * (Approval is defined by the `isActionApproved` method)
     *
     */
    function transfer(address to, uint256 value) external returns (bool success);

    /**
     * @dev MUST trigger when actions are created, approved, executed.
     *
     * Note that `state` may be 1, 2 or 3.
     */
    event ActionStateChanged(uint256 actionId, address from, uint256 state);

    /**
     * @dev MUST trigger when each method in an action is executed.
     *
     */
    event ActionMethodExecuted(uint256 actionId, bytes4 method, bytes args, bool success, bytes returnData);
}
