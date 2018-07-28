pragma solidity ^ 0.4.24;

import "../ownership/Ownable.sol";

/**
 * @title DestructibleDelayed
 * @dev Contract that can be selfdestructed after a delay period.
 */


contract DestructibleDelayed is Ownable {

  // Whether a request for the self-destruction of the contract was requested.
  bool public destructionRequested = false;

  // When self-destruction is possible (UNIX timestamp)
  uint256 public destructionTime = 2**256-1; 

  // Minimum delay after which destroy() can be called once requested
  uint256 private SELFDESTRUCTION_DELAY; 

  // Events
  event SelfDestructionRequest(uint256 _destructionTime);
  event SelfDestructionRequestCancelled();

  /**
  * @dev Constructor that sets SELFDESTRUCTION_DELAY
  * @param _destructionDelay Imposed delay between destructionRequest and selfdestruct.
  */
  function DestructibleDelayed(uint256 _destructionDelay) public {
    SELFDESTRUCTION_DELAY = _destructionDelay;
  }

  /**
  * @dev Requesting to destroy the contract 
  */
  function destroyRequest() public onlyOwner {
    require(!destructionRequested);

    destructionRequested = true;
    destructionTime = block.timestamp + SELFDESTRUCTION_DELAY; 

    emit SelfDestructionRequest(destructionTime);
  }

  /**
  * @dev Cancel the latest destroy request
  */
  function cancelDestroyRequest() public onlyOwner {  
    require(destructionRequested);
    destructionRequested = false;

    // No need to change destructionTime since destroyRequest has
    // to be called again. 

    emit SelfDestructionRequestCancelled();
  }

  /** 
  * @dev Destroy the contract
  * @param _destination Where to send the ethers held in the contract
  */
  function destroy(address _destination) public onlyOwner {
    require(_destination != 0x0);
    require(destructionRequested);
    require(block.timestamp > destructionTime);

    // Destroy
    selfdestruct(_destination);
  }

  /**
  * @dev Return SELFDESTRUCTION_DELAY value
  */ 
  function getDestructionDelay() external view returns(uint256 destructionDelay) {
    return SELFDESTRUCTION_DELAY;
  }
}
