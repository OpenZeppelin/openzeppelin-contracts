pragma solidity ^0.4.11;

import "./ERC20Basic.sol";
import "../ownership/Ownable.sol";

contract TokenWallet is Ownable{

    mapping(bytes32 => address) public tokens;

    function registerToken(address tokenAddr, bytes32 tokenName) onlyOwner{
        tokens[tokenName] = tokenAddr;
    }

    function transferToken(address tokenAddr, address to, uint value) onlyOwner returns(bool){
        return ERC20Basic(tokenAddr).transfer(to, value);
    }

    function transferToken(bytes32 tokenName, address to, uint value) onlyOwner returns(bool){
        return ERC20Basic(tokens[tokenName]).transfer(to, value);
    }

    function checkBalance(address tokenAddr) constant returns(uint){
        return ERC20Basic(tokenAddr).balanceOf(this);
    }

    function checkBalance(bytes32 tokenName) constant returns(uint){
        return ERC20Basic(tokens[tokenName]).balanceOf(this);
    }
}
