pragma solidity ^0.4.11;

 /*
 * Contract that is working with ERC223 tokens
 */
 
contract ERC223ReceivingContract {
    //function tokenFallback(address _sender, address _origin, uint _value, bytes _data) returns (bool ok);
    function tokenFallback(address from, uint value, bytes data);
}
