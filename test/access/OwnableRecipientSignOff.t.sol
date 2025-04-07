// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {OwnableRecipientSignOff} from "@openzeppelin/contracts/access/OwnableRecipientSignOff.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract OwnableRecipientSignOffMock is OwnableRecipientSignOff {
    bytes32 private constant TRANSFER_OWNERSHIP_TYPEHASH =
        keccak256("TransferOwnership(uint256 nonce,uint256 deadline)");

    constructor(address initialOwner) OwnableRecipientSignOff("OwnableRecipientSignOff") Ownable(initialOwner) {}

    function computeHash(uint256 nonce, uint256 deadline) external view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(TRANSFER_OWNERSHIP_TYPEHASH, nonce, deadline)));
    }
}

contract OwnableRecipientSignOffTest is Test {
    address private constant INITIAL_OWNER = address(1);
    OwnableRecipientSignOffMock private _ownableRecipientSignMock;
    Vm.Wallet private _newOwner;

    function setUp() external {
        _ownableRecipientSignMock = new OwnableRecipientSignOffMock(INITIAL_OWNER);
        _newOwner = vm.createWallet("_newOwner");
        assertEq(_ownableRecipientSignMock.owner(), INITIAL_OWNER);
    }

    function testTransferOwnership() public {
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;

        bytes32 hash = _ownableRecipientSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_newOwner, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(INITIAL_OWNER);
        _ownableRecipientSignMock.transferOwnership(_newOwner.addr, deadline, signature);

        assertEq(_ownableRecipientSignMock.owner(), _newOwner.addr);
        assertEq(_ownableRecipientSignMock.nonce(), nonce + 1);
    }

    function testRevertWhenUnauthorizedCallIsMadeToTransferOwnership() external {
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;
        address unauthorizedCaller = address(2);

        bytes32 hash = _ownableRecipientSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_newOwner, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(unauthorizedCaller);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedCaller));
        _ownableRecipientSignMock.transferOwnership(_newOwner.addr, deadline, signature);
    }

    function testRevertTransferOwnershipWhenSignatureExpires() external {
        uint256 deadline = block.timestamp - 1;
        uint256 nonce = 0;

        bytes32 hash = _ownableRecipientSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_newOwner, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(INITIAL_OWNER);
        vm.expectRevert(abi.encodeWithSelector(OwnableRecipientSignOff.ExpiredSignature.selector, deadline));
        _ownableRecipientSignMock.transferOwnership(_newOwner.addr, deadline, signature);
    }

    function testRevertTransferOwnershipWhenSignatureIsInvalid() external {
        Vm.Wallet memory falseSigner = vm.createWallet("falseSigner");
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;

        bytes32 hash = _ownableRecipientSignMock.computeHash(nonce, deadline);
        // Data is valid but signed by an inadequate wallet.
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(falseSigner, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(INITIAL_OWNER);
        vm.expectRevert(OwnableRecipientSignOff.InvalidSigner.selector);
        _ownableRecipientSignMock.transferOwnership(_newOwner.addr, deadline, signature);
    }
}
