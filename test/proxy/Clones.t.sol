// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract ClonesTest is Test {
    function getNumber() external pure returns (uint256) {
        return 42;
    }

    function testSymbolicPredictDeterministicAddressSpillage(address implementation, bytes32 salt) public {
        address predicted = Clones.predictDeterministicAddress(implementation, salt);
        bytes32 spillage;
        assembly ("memory-safe") {
            spillage := and(predicted, 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)
        }
        assertEq(spillage, bytes32(0));
    }

    function testCloneDirty() external {
        address cloneClean = Clones.clone(address(this));
        address cloneDirty = Clones.clone(_dirty(address(this)));

        // both clones have the same code
        assertEq(keccak256(cloneClean.code), keccak256(cloneDirty.code));

        // both clones behave as expected
        assertEq(ClonesTest(cloneClean).getNumber(), this.getNumber());
        assertEq(ClonesTest(cloneDirty).getNumber(), this.getNumber());
    }

    function testCloneDeterministicDirty(bytes32 salt) external {
        address cloneClean = Clones.cloneDeterministic(address(this), salt);
        address cloneDirty = Clones.cloneDeterministic(_dirty(address(this)), ~salt);

        // both clones have the same code
        assertEq(keccak256(cloneClean.code), keccak256(cloneDirty.code));

        // both clones behave as expected
        assertEq(ClonesTest(cloneClean).getNumber(), this.getNumber());
        assertEq(ClonesTest(cloneDirty).getNumber(), this.getNumber());
    }

    function testPredictDeterministicAddressDirty(bytes32 salt) external {
        address predictClean = Clones.predictDeterministicAddress(address(this), salt);
        address predictDirty = Clones.predictDeterministicAddress(_dirty(address(this)), salt);

        //prediction should be similar
        assertEq(predictClean, predictDirty);
    }

    function _dirty(address input) private pure returns (address output) {
        assembly ("memory-safe") {
            output := or(input, shl(160, not(0)))
        }
    }
}
