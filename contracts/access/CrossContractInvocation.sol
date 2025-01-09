// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract MessageContract{
    string private message;
    function setMessage(string memory _message)public {
        message = _message;
    }
    function getMessage()public view  returns (string memory){
        return message;
    }
}
interface IMessageContract {

    function getMessage() external view returns (string memory);
   
    
}

contract ParentContract{
    address private  contractadddress;
    constructor(address _contractaddress){
            contractadddress = _contractaddress;
    }

   
   function getMessageFromAnotherContract()public view returns (string memory) {
       return   IMessageContract(contractadddress).getMessage();
    }
}
