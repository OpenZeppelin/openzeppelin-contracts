pragma solidity ^0.8.20;  
  
import {Create2} from "../../openzeppelin-contracts/contracts/utils/Create2.sol";

contract Test{
    function test() public returns(string memory) {
        return "hello world";
    }
}
contract MyCreate2 {  
    function deploytest() public returns(address){
        uint256 amount = 0;
        bytes32 salt = keccak256("123");
        bytes memory stringBytes = type(Test).creationCode;

        return Create2.deploy(amount, salt, stringBytes);
    }

    function computeAddresstest() public returns(address) {
        bytes32 salt = keccak256("123");
        bytes memory stringBytes = type(Test).creationCode;
        bytes32 bytecodeHash = keccak256(stringBytes); 
        return Create2.computeAddress(salt, bytecodeHash);
    }
}