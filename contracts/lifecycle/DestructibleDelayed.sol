pragma solidity ^ 0.4.18;

import "../ownership/Ownable.sol";

/**
 * @title DestructibleDelayed
 * @dev Contract that can be selfdestructed after a delay period.
 */
contract DestructibleDelayed is Ownable {

   // Whether a request for the self-destruction of the contract was requested.
   bool public destructionRequested = false;

   // When self-destruction is possible
   uint256 public destructionTime = 2**256-1;

   // Minimum delay after which destroy() can be called once requested
   uint256 public SELFDESTRUCTION_DELAY = 2 weeks; 

   // Events
   event SelfDestructionRequest(uint256 _destructionTime);
   event SelfDestructionRequestCancelled();

   /*
      @dev Requesting to destroy the contract 
   */
   function destroyRequest() public onlyOwner returns (bool)
   {
      require(!destructionRequested);

      destructionRequested = true;
      destructionTime = now + SELFDESTRUCTION_DELAY; 

      SelfDestructionRequest(destructionTime);
      return true;
   }

   /*
      @dev Cancel the latest destroy request
   */
   function cancelDestroyRequest() public onlyOwner  returns (bool)
   {  
     require(destructionRequested);
     destructionRequested = false;

     // No need to change destructionTime since destroyRequest has
     // to be called again. 

     SelfDestructionRequestCancelled();
     return true;
   }

   /* 
      @dev Destroy the contract
      @param _destination Where to send the ethers held in the contract
   */
   function destroy(address _destination) public onlyOwner
   {
     require(_destination != 0x0);
     require(destructionRequested);
     require(now > destructionTime);

     selfdestruct(_destination);
   }

}
