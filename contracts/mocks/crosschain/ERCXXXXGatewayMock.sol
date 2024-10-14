// SPDX-License-Identifier: MIT

pragma solidity ^0.8.25;

import {IERCXXXXGatewaySource, IERCXXXXGatewayDestinationPassive, IERCXXXXReceiver} from "../../interfaces/draft-IERCXXXX.sol";
import {BitMaps} from "../../utils/structs/BitMaps.sol";
import {Strings} from "../../utils/Strings.sol";
import {CAIP2} from "../../utils/CAIP2.sol";
import {CAIP10} from "../../utils/CAIP10.sol";

contract ERCXXXXGatewayMock is IERCXXXXGatewaySource, IERCXXXXGatewayDestinationPassive {
    using BitMaps for BitMaps.BitMap;
    using Strings for *;

    BitMaps.BitMap private _outbox;
    bool private _activeMode;

    function _setActive(bool newActiveMode) internal {
        _activeMode = newActiveMode;
    }

    function supportsAttribute(bytes4 /*selector*/) public pure returns (bool) {
        return false;
    }

    function sendMessage(
        string calldata destination, // CAIP-2 chain ID
        string calldata receiver, // CAIP-10 account ID
        bytes calldata payload,
        bytes[] calldata attributes
    ) public payable returns (bytes32) {
        string memory source = CAIP2.local();
        string memory sender = msg.sender.toChecksumHexString();

        require(destination.equal(source), "This mock only supports local messages");
        for (uint256 i = 0; i < attributes.length; ++i) {
            bytes4 selector = bytes4(attributes[i][0:4]);
            require(supportsAttribute(selector), UnsuportedAttribute(selector));
        }

        if (_activeMode) {
            address target = Strings.parseAddress(receiver);
            IERCXXXXReceiver(target).receiveMessage(address(this), new bytes(0), source, sender, payload, attributes);
        } else {
            _outbox.set(uint256(keccak256(abi.encode(source, sender, receiver, payload, attributes))));
        }

        emit MessageCreated(0, CAIP10.format(source, sender), CAIP10.format(source, receiver), payload, attributes);
        return 0;
    }

    function validateReceivedMessage(
        bytes calldata /*messageKey*/, // this mock doesn't use a messageKey
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) public {
        uint256 digest = uint256(
            keccak256(abi.encode(source, sender, msg.sender.toChecksumHexString(), payload, attributes))
        );
        require(_outbox.get(digest), "invalid message");
        _outbox.unset(digest);
    }
}
