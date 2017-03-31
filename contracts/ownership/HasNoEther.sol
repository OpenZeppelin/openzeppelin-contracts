pragma solidity ^0.4.8;

import "./Ownable.sol";

/// @title Contracts that should not own Ether
/// @author Remco Bloemen <remco@2π.com>
///
/// This tries to block incoming ether to prevent accidental
/// loss of Ether. Should Ether end up in the contrat, it will
/// allow the owner to reclaim this ether.
///
/// @notice Ether can still be send to this contract by:
///  * calling functions labeled `payable`
///  * `selfdestruct(contract_address)`
///  * mining directly to the contract address
contract HasNoEther is Ownable {

  /// Constructor that rejects incoming Ether
  /// @dev The flag `payable` is added so we can access `msg.value`
  ///      without compiler warning. If we leave out payable, then
  ///      Solidity will allow inheriting contracts to implement a
  ///      payable constructor. By doing it this way we prevent a
  ///      payable constructor from working.
  ///      Alternatively we could use assembly to access msg.value.
  function HasNoEther() payable {
    if(msg.value > 0) {
      throw;
    }
  }

  /// Disallow direct send by settings a default function without `payable`
  function() external {
  }

  /// Transfer all Ether owned by the contract to the owner
  /// @dev What if owner is itself a contract marked HasNoEther?
  function reclaimEther() external onlyOwner {
    if(!owner.send(this.balance)) {
      throw;
    }
  }
}
