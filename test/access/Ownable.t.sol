// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../contracts/mocks/OwnableMock.sol";

contract OwnableTest is Test {
    address _owner = makeAddr("owner");
    address _other = makeAddr("other");
    OwnableMock public ownable;

    function setUp() public {
        vm.prank(_owner);
        ownable = new OwnableMock();
    }

    function testHasOwner() public {
        assertEq(ownable.owner(), _owner);
    }

    ///@dev changes owner after transfer
    function testTransferOwnership() public {
        vm.prank(_owner);
        // vm.expectEmit(true, true, false, true, address(ownable));
        ownable.transferOwnership(_other);

        assertEq(ownable.owner(), _other);
    }

    /// @dev prevents non-owners from transferring
    function testTransferOwnershipNonOwner() public {
        vm.prank(_other);
        vm.expectRevert("Ownable: caller is not the owner");
        ownable.transferOwnership(_owner);
    }

    /// @dev guards ownership against stuck state
    function testTransferCantStuck() public {
        vm.prank(_owner);
        vm.expectRevert("Ownable: new owner is the zero address");
        ownable.transferOwnership(address(0));
    }

    /// @dev loses owner after renouncement
    function testRenounceOwnership() public {
        vm.prank(_other);
        vm.expectRevert("Ownable: caller is not the owner");
        ownable.renounceOwnership();

        vm.prank(_owner);
        // vm.expectEmit(true, true, false, true, address(ownable));
        ownable.renounceOwnership();

        assertEq(ownable.owner(), address(0));
    }
}
