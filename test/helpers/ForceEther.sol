pragma solidity ^0.4.8;

// @title Force Ether into a contract.
// @notice  even
// if the contract is not payable.
// @notice To use, construct the contract with the target as argument.
// @author Remco Bloemen <remco@neufund.org>
contract ForceEther  {
  function ForceEther(address target) payable {
    // Selfdestruct transfers all Ether to the arget address
    selfdestruct(target);
  }
}
