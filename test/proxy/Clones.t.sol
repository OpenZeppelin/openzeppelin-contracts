// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract ClonesTest is Test {
    function getNumber() external pure returns (uint256) {
        return 42;
    }

    function testSymbolicPredictDeterministicAddressSpillage(address implementation, bytes32 salt) public view {
        address predicted = Clones.predictDeterministicAddress(implementation, salt);
        bytes32 spillage;
        assembly ("memory-safe") {
            spillage := and(predicted, 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)
        }
        assertEq(spillage, bytes32(0));
    }

    function testSymbolicPredictDeterministicAddressWithImmutableArgsSpillage(
        address implementation,
        bytes32 salt,
        bytes memory args
    ) public view {
        vm.assume(args.length < 0xbfd3);

        address predicted = Clones.predictDeterministicAddressWithImmutableArgs(implementation, args, salt);
        bytes32 spillage;
        /// @solidity memory-safe-assembly
        assembly {
            spillage := and(predicted, 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)
        }
        assertEq(spillage, bytes32(0));
    }

    function testCloneDirty() external {
        address cloneClean = Clones.clone(address(this));
        address cloneDirty = Clones.clone(_dirty(address(this)));

        // both clones have the same code
        assertEq(cloneClean.code, cloneDirty.code);

        // both clones behave as expected
        assertEq(ClonesTest(cloneClean).getNumber(), this.getNumber());
        assertEq(ClonesTest(cloneDirty).getNumber(), this.getNumber());
    }

    function testCloneDeterministicDirty(bytes32 salt) external {
        address cloneClean = Clones.cloneDeterministic(address(this), salt);
        address cloneDirty = Clones.cloneDeterministic(_dirty(address(this)), ~salt);

        // both clones have the same code
        assertEq(cloneClean.code, cloneDirty.code);

        // both clones behave as expected
        assertEq(ClonesTest(cloneClean).getNumber(), this.getNumber());
        assertEq(ClonesTest(cloneDirty).getNumber(), this.getNumber());
    }

    function testPredictDeterministicAddressDirty(bytes32 salt) external view {
        address predictClean = Clones.predictDeterministicAddress(address(this), salt);
        address predictDirty = Clones.predictDeterministicAddress(_dirty(address(this)), salt);

        //prediction should be similar
        assertEq(predictClean, predictDirty);
    }

    function testFetchCloneArgs(bytes memory args, bytes32 salt) external {
        vm.assume(args.length < 0xbfd3);

        address instance1 = Clones.cloneWithImmutableArgs(address(this), args);
        address instance2 = Clones.cloneDeterministicWithImmutableArgs(address(this), args, salt);

        // both clones have the same code
        assertEq(instance1.code, instance2.code);

        // both clones behave as expected and args can be fetched
        assertEq(ClonesTest(instance1).getNumber(), this.getNumber());
        assertEq(ClonesTest(instance2).getNumber(), this.getNumber());
        assertEq(Clones.fetchCloneArgs(instance1), args);
        assertEq(Clones.fetchCloneArgs(instance2), args);
    }

    function _dirty(address input) private pure returns (address output) {
        assembly ("memory-safe") {
            output := or(input, shl(160, not(0)))
        }
    }
}
