pragma solidity ^0.4.8;


import "../ownership/Ownable.sol";

/* 
In practice any public Ethereum address is a target to receiving ETH. 
Often ETH will find its way to a Contract via send (not via a function call), even though the contract was not meant to receive ETH. For this reason all contracts should have a withdrawEther function, even after a contract is meant to retire. For this reason no contract should really ever selfdestruct, instead always only having the withdrawEther function active and disabling all other functions.
*/

contract Destructible is Ownable {

	bool contractActive = true;

	/// @notice Set this contract as inactive but do not destroy, withdrawEther
  function destroy() onlyOwner destroyable {
    contractActive = false;
    withdrawEther();
  }

  /// @notice Withdraw all Ether in this contract
  /// @return True if successful
  function withdrawEther() payable onlyOwner returns (bool) {
      return owner.send(this.balance);
  }

  /// @notice ALl functions with this modifier will become inaccessible after a call to destroy
  modifier destroyable() {
    if (!contractActive) {
      throw;
    }
    _;
  }

  function destroyAndSend(address _recipient) onlyOwner {
    selfdestruct(_recipient);
  }
}


