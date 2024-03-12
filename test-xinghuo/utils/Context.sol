pragma solidity ^0.8.20;  
  
import {Context} from "../../openzeppelin-contracts/contracts/utils/Context.sol";

contract MyContext is Context {

    function getMsgSender() public returns(address) {
        return _msgSender();
    }

    function getMsgData() public returns(bytes memory) {
        return _msgData();
    }

}