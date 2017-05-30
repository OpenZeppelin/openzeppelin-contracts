pragma solidity ^0.4.11;


/**
 * @title Pausable
 * @dev Base contract which allows children to implement a pause and unpause mechanism.
 */

contract Pausable  is PauseInfrastructure{
    /**
     * constructor assigns initial paused state
     * @param _paused selects the initial pause state.
     */
    function Pausable(bool _paused) PauseInfrastructure(_paused){
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function pause() onlyOwner whenNotPaused returns (bool) {
        paused = true;
        triggerPauseEvent();
        return true;
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause() onlyOwner whenPaused returns (bool) {
        paused = false;
        triggerUnpauseEvent();
        return true;
    }
}
