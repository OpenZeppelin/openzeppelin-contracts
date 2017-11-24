pragma solidity ^0.4.11;

import "./ERC20Basic.sol";
import "../ownership/Ownable.sol";

/**
* @title Token Wallet
* @notice Base contract that allows children contracts to handle ERC20 tokens
*/
contract TokenWallet is Ownable{
    /**
    * @dev Transfer owned tokes
    * @param tokenAddr address the token address
    * @param to address The address to transfer tokens to
    * @param value uint256 The amount of tokens to transfer
    * @return bool if transfer is successful
    */
    function transferToken(address tokenAddr, address to, uint value) onlyOwner returns(bool){
        return ERC20Basic(tokenAddr).transfer(to, value);
    }

    /**
    * @dev Check the balance of a token
    * @param tokenAddr address the token address
    * @return uint representing the amount of tokens
    */
    function checkBalance(address tokenAddr) constant returns(uint){
        return ERC20Basic(tokenAddr).balanceOf(this);
    }
}
