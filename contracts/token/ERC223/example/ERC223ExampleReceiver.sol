pragma solidity ^0.4.11;

import "../interface/ERC223ReceivingContract.sol";

contract ERC223ExampleReceiver is ERC223ReceivingContract {
    function tokenFallback(address from, uint value, bytes data){
        LogFallbackParameters(from, value, data);
    }
    event LogFallbackParameters(address from, uint value, bytes data);
}
