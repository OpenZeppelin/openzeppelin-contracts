pragma solidity ^0.5.0;


// @title Force Ether into a contract.
// @notice  even
// if the contract is not payable.
// @notice To use, construct the contract with the target as argument.
// @author Remco Bloemen <remco@neufund.org>
contract ForceEther {

    constructor() public payable {
        // solhint-disable-previous-line no-empty-blocks
    }

    function destroyAndSend(address payable recipient) public {
        selfdestruct(recipient);
    }
}
