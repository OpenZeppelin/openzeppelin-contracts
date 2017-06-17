pragma solidity ^0.4.11;

import "../../contracts/token/ERC223/interface/ERC223ReceivingContract.sol";

contract ERC223TokenReceiverMock is ERC223ReceivingContract {
    address public tokenSender;
    uint public sentValue;
    bytes public tokenData;

    bool public calledFallback = false;

    function tokenFallback(address from, uint value, bytes data){
        calledFallback = true;

        tokenSender = from;
        sentValue = value;
        tokenData = data;
    }
}
