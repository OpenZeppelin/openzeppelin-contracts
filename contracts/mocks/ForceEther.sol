pragma solidity ^0.4.23;


// @title Force Ether into a contract.
// @notice  even
// if the contract is not payable.
// @notice To use, construct the contract with the target as argument.
// @author Remco Bloemen <remco@neufund.org>
contract ForceEther {

  constructor() public payable { }

  function destroyAndSend(address _recipient) public {
    selfdestruct(_recipient);
  }
}
