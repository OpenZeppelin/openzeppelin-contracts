// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

// solhint-disable func-name-mixedcase

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract DummyContract {
    function getNumber() external pure returns (uint256) {
        return 42;
    }
}

contract ClonesMock {
    function cloneContract(address target) external returns (address) {
        return Clones.clone(target);
    }

    function cloneDirtyTarget(address target) external returns (address) {
        // Add dirty bits; will start with (0xff..)
        assembly {
            // Get type(uint256).max and shift to the left by 20 bytes => `or` with target
            target := or(shl(160, not(0)), target)
        }
        return Clones.clone(target);
    }

    function cloneContractDeterministic(address target) external returns (address) {
        return Clones.clone(target);
    }

    function cloneDirtyTargetDeterministic(address target) external returns (address) {
        // Add dirty bits; will start with (0xff..)
        assembly {
            // Get type(uint256).max and shift to the left by 20 bytes => `or` with target
            target := or(shl(160, not(0)), target)
        }
        return Clones.clone(target);
    }
}

contract ClonesTest is Test {
    DummyContract private dummy;
    ClonesMock private clonesWrapper;

    function setUp() public {
        dummy = new DummyContract();
        clonesWrapper = new ClonesMock();
    }

    function testSymbolicPredictDeterministicAddressSpillage(address implementation, bytes32 salt) public {
        address predicted = Clones.predictDeterministicAddress(implementation, salt);
        bytes32 spillage;
        /// @solidity memory-safe-assembly
        assembly {
            spillage := and(predicted, 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)
        }
        assertEq(spillage, bytes32(0));
    }

    function test_DummyContractReturnsCorrectNumber() external {
        assertEq(dummy.getNumber(), 42);
    }

    /// Clone

    function test_ValidCloneOfDummyContractReturnsCorrectNumber() external {
        DummyContract dummyClone = DummyContract(clonesWrapper.cloneContract(address(dummy)));
        assertEq(dummyClone.getNumber(), dummy.getNumber());
    }

    function test_ClonesOfSameAddressHaveSameCodeDirty() external {
        address clone = clonesWrapper.cloneContract(address(dummy));
        address invalidClone = clonesWrapper.cloneDirtyTarget(address(dummy));

        assertEq(keccak256(clone.code), keccak256(invalidClone.code));
    }

    function testFail_CallToInvalidCloneWillRevertBecauseItHasNoCode() external {
        DummyContract invalidDummyClone = DummyContract(clonesWrapper.cloneDirtyTarget(address(dummy)));
        vm.expectRevert();
        invalidDummyClone.getNumber();
    }

    /// Clone Deterministic

    function test_ValidCloneOfDummyContractReturnsCorrectNumber_Deterministic() external {
        DummyContract dummyClone = DummyContract(clonesWrapper.cloneContractDeterministic(address(dummy)));
        assertEq(dummyClone.getNumber(), dummy.getNumber());
    }

    function test_ClonesOfSameAddressHaveSameCodeDirty_Deterministic() external {
        address clone = clonesWrapper.cloneContractDeterministic(address(dummy));
        address invalidClone = clonesWrapper.cloneDirtyTargetDeterministic(address(dummy));

        assertEq(keccak256(clone.code), keccak256(invalidClone.code));
    }

    function testFail_CallToInvalidCloneWillRevertBecauseItHasNoCode_Deterministic() external {
        DummyContract invalidDummyClone = DummyContract(clonesWrapper.cloneDirtyTargetDeterministic(address(dummy)));
        vm.expectRevert();
        invalidDummyClone.getNumber();
    }
}
