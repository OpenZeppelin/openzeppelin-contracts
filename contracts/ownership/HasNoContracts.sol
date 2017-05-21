pragma solidity ^0.4.8;

import "./Ownable.sol";

/// @title Contracts that should not own Contracts
/// @author Remco Bloemen <remco@2π.com>
///
/// Should contracts (anything Ownable) end up being owned by
/// this contract, it allows the owner of this contract to
/// reclaim ownership of the contracts.
contract HasNoContracts is Ownable {

  /// Reclaim ownership of Ownable contracts
  function reclaimContract(address contractAddr) external onlyOwner {
    Ownable contractInst = Ownable(contractAddr);
    contractInst.transferOwnership(owner);
  }
}
