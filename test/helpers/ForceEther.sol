pragma solidity ^0.4.11;

// @title Force Ether into a contract.
// @notice  even
// if the contract is not payable.
// @notice To use, construct the contract with the target as argument.
// @author Remco Bloemen <remco@neufund.org>
contract ForceEther  {

  function ForceEther() payable { }

  function destroyAndSend(address _recipient) {
    selfdestruct(_recipient);
  }
}
