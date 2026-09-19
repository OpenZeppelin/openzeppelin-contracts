// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IERC7786GatewaySource} from "@openzeppelin/contracts/interfaces/IERC7786.sol";
import {InteroperableAddress} from "@openzeppelin/contracts/utils/draft-InteroperableAddress.sol";
import {CrosschainLinked} from "@openzeppelin/contracts/crosschain/CrosschainLinked.sol";
import {BridgeFungible} from "@openzeppelin/contracts/crosschain/bridges/abstract/BridgeFungible.sol";
import {BridgeNonFungible} from "@openzeppelin/contracts/crosschain/bridges/abstract/BridgeNonFungible.sol";
import {BridgeMultiToken} from "@openzeppelin/contracts/crosschain/bridges/abstract/BridgeMultiToken.sol";

contract AddressLengthGatewayMock is IERC7786GatewaySource {
    function supportsAttribute(bytes4) external pure returns (bool) {
        return true;
    }

    function sendMessage(bytes calldata, bytes calldata, bytes[] calldata) external payable returns (bytes32) {
        return bytes32(0);
    }
}

contract BridgeFungibleAddressLengthHarness is BridgeFungible {
    constructor(CrosschainLinked.Link[] memory links) CrosschainLinked(links) {}

    function send(bytes memory to) external returns (bytes32) {
        return _crosschainTransfer(msg.sender, to, 1);
    }

    function _onSend(address, uint256) internal override {}

    function _onReceive(address, uint256) internal override {}
}

contract BridgeNonFungibleAddressLengthHarness is BridgeNonFungible {
    constructor(CrosschainLinked.Link[] memory links) CrosschainLinked(links) {}

    function send(bytes memory to) external returns (bytes32) {
        return _crosschainTransfer(msg.sender, to, 1);
    }

    function _onSend(address, uint256) internal override {}

    function _onReceive(address, uint256) internal override {}
}

contract BridgeMultiTokenAddressLengthHarness is BridgeMultiToken {
    constructor(CrosschainLinked.Link[] memory links) CrosschainLinked(links) {}

    function send(bytes memory to) external returns (bytes32) {
        uint256[] memory ids = new uint256[](1);
        uint256[] memory values = new uint256[](1);
        ids[0] = 1;
        values[0] = 1;
        return _crosschainTransfer(msg.sender, to, ids, values, "");
    }

    function _onSend(address, uint256[] memory, uint256[] memory) internal override {}

    function _onReceive(address, uint256[] memory, uint256[] memory, bytes memory) internal override {}
}

contract BridgeAddressLengthTest is Test {
    BridgeFungibleAddressLengthHarness private _fungible;
    BridgeNonFungibleAddressLengthHarness private _nonFungible;
    BridgeMultiTokenAddressLengthHarness private _multiToken;

    function setUp() public {
        AddressLengthGatewayMock gateway = new AddressLengthGatewayMock();
        CrosschainLinked.Link[] memory links = new CrosschainLinked.Link[](1);
        links[0] = CrosschainLinked.Link({
            gateway: address(gateway),
            counterpart: InteroperableAddress.formatEvmV1(2, address(0xBEEF))
        });

        _fungible = new BridgeFungibleAddressLengthHarness(links);
        _nonFungible = new BridgeNonFungibleAddressLengthHarness(links);
        _multiToken = new BridgeMultiTokenAddressLengthHarness(links);
    }

    function testFungibleRejectsShortAddress() public {
        vm.expectRevert(abi.encodeWithSelector(BridgeFungible.CrosschainFungibleInvalidAddressLength.selector, 4));
        _fungible.send(_malformedEvmAddress(4));
    }

    function testFungibleRejectsLongAddress() public {
        vm.expectRevert(abi.encodeWithSelector(BridgeFungible.CrosschainFungibleInvalidAddressLength.selector, 21));
        _fungible.send(_malformedEvmAddress(21));
    }

    function testNonFungibleRejectsShortAddress() public {
        vm.expectRevert(
            abi.encodeWithSelector(BridgeNonFungible.CrosschainNonFungibleInvalidAddressLength.selector, 4)
        );
        _nonFungible.send(_malformedEvmAddress(4));
    }

    function testNonFungibleRejectsLongAddress() public {
        vm.expectRevert(
            abi.encodeWithSelector(BridgeNonFungible.CrosschainNonFungibleInvalidAddressLength.selector, 21)
        );
        _nonFungible.send(_malformedEvmAddress(21));
    }

    function testMultiTokenRejectsShortAddress() public {
        vm.expectRevert(abi.encodeWithSelector(BridgeMultiToken.CrosschainMultiTokenInvalidAddressLength.selector, 4));
        _multiToken.send(_malformedEvmAddress(4));
    }

    function testMultiTokenRejectsLongAddress() public {
        vm.expectRevert(abi.encodeWithSelector(BridgeMultiToken.CrosschainMultiTokenInvalidAddressLength.selector, 21));
        _multiToken.send(_malformedEvmAddress(21));
    }

    function _malformedEvmAddress(uint256 length) private pure returns (bytes memory) {
        return InteroperableAddress.formatV1(bytes2(0), abi.encodePacked(uint8(2)), new bytes(length));
    }
}
