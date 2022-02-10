// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/Address.sol";

abstract contract BaseRelayMock {
    address public _sender;

    function relayAs(address target, bytes calldata data, address sender) external {
        address previousSender = _sender;

        _sender = sender;

        (bool success, bytes memory returndata) = target.call(data);
        Address.verifyCallResult(success, returndata, "low-level call reverted");

        _sender = previousSender;
    }
}

/**
 * AMB
 */
contract BridgeAMBMock is BaseRelayMock {
    function messageSender() public view returns (address) { return _sender; }
}

/**
 * Arbitrum
 */
contract BridgeArbitrumL1Mock is BaseRelayMock {
    address public immutable inbox  = address(new BridgeArbitrumL1Inbox());
    address public immutable outbox = address(new BridgeArbitrumL1Outbox());

    function activeOutbox() public view returns (address) { return outbox; }
}

contract BridgeArbitrumL1Inbox {
    address public immutable bridge = msg.sender;
}

contract BridgeArbitrumL1Outbox {
    address public immutable bridge = msg.sender;

    function l2ToL1Sender() public view returns (address) { return BaseRelayMock(bridge)._sender(); }
}

contract BridgeArbitrumL2Mock is BaseRelayMock {
    function isTopLevelCall() public view returns (bool) { return _sender != address(0); }
    function wasMyCallersAddressAliased() public pure returns (bool) { return true; }
    function myCallersAddressWithoutAliasing() public view returns (address) { return _sender; }
}
/**
 * Optimism
 */
contract BridgeOptimismMock is BaseRelayMock {
    function xDomainMessageSender() public view returns (address) { return _sender; }
}