// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {Ownable2StepSign} from "@openzeppelin/contracts/access/Ownable2StepSign.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Ownable2StepSignMock is Ownable2StepSign {
    bytes32 private constant TRANSFER_OWNERSHIP_TYPEHASH =
        keccak256("TransferOwnership(uint256 nonce,uint256 deadline)");

    constructor(address initialOwner) Ownable2StepSign("Ownable2StepSign") Ownable(initialOwner) {}

    function computeHash(uint256 nonce, uint256 deadline) external view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(TRANSFER_OWNERSHIP_TYPEHASH, nonce, deadline)));
    }
}

contract Ownable2StepSignTest is Test {
    address private constant INITIAL_OWNER = address(1);
    Ownable2StepSignMock private ownable2StepSignMock;
    Vm.Wallet private newOwner;

    function setUp() external {
        ownable2StepSignMock = new Ownable2StepSignMock(INITIAL_OWNER);
        newOwner = vm.createWallet("newOwner");
        assertEq(ownable2StepSignMock.owner(), INITIAL_OWNER);
    }

    function testTransferOwnership() public {
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;

        bytes32 hash = ownable2StepSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(newOwner, hash);

        vm.prank(INITIAL_OWNER);
        ownable2StepSignMock.transferOwnership(newOwner.addr, deadline, v, r, s);

        assertEq(ownable2StepSignMock.owner(), newOwner.addr);
        assertEq(ownable2StepSignMock.nonce(), nonce + 1);
    }

    function testTransferOwnershipDeletesPendingOwner() external {
        vm.prank(INITIAL_OWNER);
        ownable2StepSignMock.transferOwnership(address(2));
        assertEq(ownable2StepSignMock.pendingOwner(), address(2));

        testTransferOwnership();

        assertEq(ownable2StepSignMock.pendingOwner(), address(0));
    }

    function testRevertWhenUnauthorizedCallIsMadeToTransferOwnership() external {
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;
        address unauthorizedCaller = address(2);

        bytes32 hash = ownable2StepSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(newOwner, hash);

        vm.prank(unauthorizedCaller);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedCaller));
        ownable2StepSignMock.transferOwnership(newOwner.addr, deadline, v, r, s);
    }

    function testRevertTransferOwnershipWhenSignatureExpires() external {
        uint256 deadline = block.timestamp - 1;
        uint256 nonce = 0;

        bytes32 hash = ownable2StepSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(newOwner, hash);

        vm.prank(INITIAL_OWNER);
        vm.expectRevert(abi.encodeWithSelector(Ownable2StepSign.ExpiredSignature.selector, deadline));
        ownable2StepSignMock.transferOwnership(newOwner.addr, deadline, v, r, s);
    }

    function testRevertTransferOwnershipWhenSignatureIsInvalid() external {
        Vm.Wallet memory falseSigner = vm.createWallet("falseSigner");
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;

        bytes32 hash = ownable2StepSignMock.computeHash(nonce, deadline);
        // Data is valid but signed by an inadequate wallet.
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(falseSigner, hash);

        vm.prank(INITIAL_OWNER);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable2StepSign.InvalidSigner.selector, falseSigner.addr, newOwner.addr)
        );
        ownable2StepSignMock.transferOwnership(newOwner.addr, deadline, v, r, s);
    }
}
