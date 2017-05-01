pragma solidity ^0.4.8;

import "./Ownable.sol";

/** @title Contracts that should not own Contracts
* @author Remco Bloemen <remco@2π.com>
* @dev Should contracts (anything Ownable) end up being owned by this contract, it allows the owner of this contract to reclaim ownership of the contracts.
*/
contract HasNoContracts is Ownable {

  /**
  * @dev Reclaim ownership of Ownable contracts
  * @param contractAddr address The Ownable contract address wished to
  be reclaimed
  */
  function reclaimContract(address contractAddr) external onlyOwner {
    Ownable contractInst = Ownable(contractAddr);
    contractInst.transferOwnership(owner);
  }
}
