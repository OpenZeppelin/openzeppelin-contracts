pragma solidity ^0.4.11;

import "truffle/Assert.sol";
import "../contracts/token/ERC223/example/ERC223ExampleToken.sol";
import "./helpers/ERC223TokenReceiverMock.sol";

contract ERC223TokenReceiverTest {
    ERC223ExampleToken token;
    ERC223TokenReceiverMock receiver;

    function beforeEach() {
        token = new ERC223ExampleToken(100);
        receiver = new ERC223TokenReceiverMock();
    }

    function testFallbackIsCalledOnTransfer() {
        token.transfer(receiver, 10);

        Assert.equal(receiver.tokenSender(), this, 'Sender should be correct');
        Assert.equal(receiver.sentValue(), 10, 'Value should be correct');
    }

    function testCorrectFunctionIsCalledOnTransfer() {
        bytes memory data = new bytes(4);
        token.transfer(receiver, 20, data);

        Assert.isTrue(receiver.calledFallback(), 'Should have called foo');
    }
}
