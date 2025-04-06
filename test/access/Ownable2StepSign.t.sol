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
    Ownable2StepSignMock private _ownable2StepSignMock;
    Vm.Wallet private _newOwner;

    function setUp() external {
        _ownable2StepSignMock = new Ownable2StepSignMock(INITIAL_OWNER);
        _newOwner = vm.createWallet("_newOwner");
        assertEq(_ownable2StepSignMock.owner(), INITIAL_OWNER);
    }

    function testDomainSeparator() public {
        bytes32 manuallyComputedDomainSeparator = keccak256(
            abi.encode(
                // TYPE_HASH
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Ownable2StepSign")),
                keccak256(bytes("1")),
                block.chainid,
                address(_ownable2StepSignMock)
            )
        );
        assertEq(_ownable2StepSignMock.DOMAIN_SEPARATOR(), manuallyComputedDomainSeparator);
    }

    function testTransferOwnership() public {
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;

        bytes32 hash = _ownable2StepSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_newOwner, hash);

        vm.prank(INITIAL_OWNER);
        _ownable2StepSignMock.transferOwnership(_newOwner.addr, deadline, v, r, s);

        assertEq(_ownable2StepSignMock.owner(), _newOwner.addr);
        assertEq(_ownable2StepSignMock.nonce(), nonce + 1);
    }

    function testTransferOwnershipDeletesPendingOwner() external {
        vm.prank(INITIAL_OWNER);
        _ownable2StepSignMock.transferOwnership(address(2));
        assertEq(_ownable2StepSignMock.pendingOwner(), address(2));

        testTransferOwnership();

        assertEq(_ownable2StepSignMock.pendingOwner(), address(0));
    }

    function testRevertWhenUnauthorizedCallIsMadeToTransferOwnership() external {
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;
        address unauthorizedCaller = address(2);

        bytes32 hash = _ownable2StepSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_newOwner, hash);

        vm.prank(unauthorizedCaller);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedCaller));
        _ownable2StepSignMock.transferOwnership(_newOwner.addr, deadline, v, r, s);
    }

    function testRevertTransferOwnershipWhenSignatureExpires() external {
        uint256 deadline = block.timestamp - 1;
        uint256 nonce = 0;

        bytes32 hash = _ownable2StepSignMock.computeHash(nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_newOwner, hash);

        vm.prank(INITIAL_OWNER);
        vm.expectRevert(abi.encodeWithSelector(Ownable2StepSign.ExpiredSignature.selector, deadline));
        _ownable2StepSignMock.transferOwnership(_newOwner.addr, deadline, v, r, s);
    }

    function testRevertTransferOwnershipWhenSignatureIsInvalid() external {
        Vm.Wallet memory falseSigner = vm.createWallet("falseSigner");
        uint256 deadline = block.timestamp;
        uint256 nonce = 0;

        bytes32 hash = _ownable2StepSignMock.computeHash(nonce, deadline);
        // Data is valid but signed by an inadequate wallet.
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(falseSigner, hash);

        vm.prank(INITIAL_OWNER);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable2StepSign.InvalidSigner.selector, falseSigner.addr, _newOwner.addr)
        );
        _ownable2StepSignMock.transferOwnership(_newOwner.addr, deadline, v, r, s);
    }
}
