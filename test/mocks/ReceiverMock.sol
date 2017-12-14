pragma solidity ^0.4.15;

import "../../contracts/examples/ExampleReceiver.sol";

contract ReceiverMock is ExampleReceiver {
  uint public sentValue;
  address public tokenAddr;
  address public tokenSender;
  bool public calledFoo;

  bytes public tokenData;
  bytes4 public tokenSig;

  function foo() tokenPayable {
    saveTokenValues();
    calledFoo = true;
  }

  function () tokenPayable {
    saveTokenValues();
  }

  function saveTokenValues() private {
    tokenAddr = tkn.addr;
    tokenSender = tkn.sender;
    sentValue = tkn.value;
    tokenSig = tkn.sig;
    tokenData = tkn.data;
  }
}