pragma solidity ^0.4.18;

import "truffle/Assert.sol";
import "../../contracts/examples/Simple223Token.sol";
import "./ReceiverMock.sol";

contract ReceiverTest {
  Simple223Token token;
  ReceiverMock receiver;

  function beforeEach() {
    token = new Simple223Token();
    receiver = new ReceiverMock();
  }

  function testFallbackIsCalledOnTransfer() {
    token.transfer(receiver, 10);

    Assert.equal(receiver.tokenAddr(), token, 'Token address should be correct');
    Assert.equal(receiver.tokenSender(), this, 'Sender should be correct');
    Assert.equal(receiver.sentValue(), 10, 'Value should be correct');
  }

  function testCorrectFunctionIsCalledOnTransfer() {
    bytes memory data = new bytes(4); // foo() is 0xc2985578
    data[0] = 0xc2; data[1] = 0x98; data[2] = 0x55; data[3] = 0x78;

    token.transfer(receiver, 20, data);

    Assert.equal(receiver.tokenSig(), bytes4(0xc2985578), 'Sig should be correct');
    Assert.isTrue(receiver.calledFoo(), 'Should have called foo');
  }
}