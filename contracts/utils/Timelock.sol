// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

/**
 * @dev Contract module provide tolling for building timelocked operation.

 * Operation are described using a bytes32 identifier. They can be committed,
 * revealed or canceled. This

 * This module is used through inheritance. It will make available the methods
 * `_commit`, `_reveal` and `_cancel`, which can be used to control the
 * lifecycle of timelocked commitment identified using bytes32.
 */
abstract contract Timelock {
    mapping(bytes32 => uint256) private _commitments;
    uint256 private _minDelay;

    /**
     * @dev Emitted when entity `id` is submitted.
     */
    event Commit(bytes32 indexed id);

    /**
    * @dev Emitted when entity `id` is revealed.
    */
    event Reveal(bytes32 indexed id);

    /**
    * @dev Emitted when entity `id` is canceled.
    */
    event Cancel(bytes32 indexed id);

    /**
    * @dev Emitted when the minimum deplay for future commitments is modified.
    */
    event MinDelayChange(uint256 newDuration, uint256 oldDuration);

    /**
     * @dev Initializes the contract with a given `minDelay`.
     */
    constructor(uint256 minDelay) public {
        _minDelay = minDelay;
    }

    /**
     * @dev Returns the timestamp at with an entity becomes valid (0 for
     * unscheduled entity).
     */
    function viewCommitment(bytes32 id) public view returns (uint256 timestamp) {
        return _commitments[id];
    }

    /**
    * @dev Returns weither an entity is ready or not.
    */
    function isCommitmentReady(bytes32 id) public view returns (bool ready) {
        // solhint-disable-next-line not-rely-on-time
        return _commitments[id] <= block.timestamp;
    }

    /**
     * @dev Returns the minimum delay for a entity to become valid.
     */
    function viewMinDelay() public view returns (uint256 duration) {
        return _minDelay;
    }

    /**
     * @dev Submit an entity that is to becomes valid after a given delay.
     *
     * Emits a {Commit} event.
     */
    function _commit(bytes32 id, uint256 delay) internal {
        require(_commitments[id] == 0, "Timelock: commitment already exists");
        require(delay >= _minDelay, "Timelock: insufficient delay");
        // solhint-disable-next-line not-rely-on-time
        _commitments[id] = block.timestamp + delay;

        emit Commit(id);
    }

    /**
    * @dev Cancel a entity.
     *
     * Emits a {Cancel} event.
    */
    function _cancel(bytes32 id) internal {
        delete _commitments[id];

        emit Cancel(id);
    }

    /**
     * @dev Reveal a ready entity.
     *
     * Emits a {Reveal} event.
     */
    function _reveal(bytes32 id) internal {
        require(_commitments[id] > 0, "Timelock: no matching commitment");
        require(isCommitmentReady(id), "Timelock: too early to execute");
        delete _commitments[id];

        emit Reveal(id);
    }

    /**
     * @dev Changes the timelock duration for future operations.
     *
     * Emits a {MinDelayChange} event.
     */
    function _updateDelay(uint256 newDelay) internal {
        emit MinDelayChange(newDelay, _minDelay);
        _minDelay = newDelay;
    }
}

// Time tracking
// 28/08: 3h+2h
// 30/08: 1h
//  1/09: 1h
