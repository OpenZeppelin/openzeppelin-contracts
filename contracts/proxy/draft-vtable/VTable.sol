// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
* @title VTable
* @dev TODO
*/
library VTable {
    // bytes32 private constant _VTABLE_SLOT = bytes32(uint256(keccak256("openzeppelin.vtable.location")) - 1);
    bytes32 private constant _VTABLE_SLOT = 0x13f1d5ea37b1d7aca82fcc2879c3bddc731555698dfc87ad6057b416547bc657;

    struct VTableStore {
        address _owner;
        mapping (bytes4 => address) _delegates;
    }

    /**
     * @dev Get singleton instance
     */
    function instance() internal pure returns (VTableStore storage vtable) {
        bytes32 position = _VTABLE_SLOT;
        assembly {
            vtable.slot := position
        }
    }

    /**
     * @dev Ownership management
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function getOwner(VTableStore storage vtable) internal view returns (address) {
        return vtable._owner;
    }

    function setOwner(VTableStore storage vtable, address newOwner) internal {
        emit OwnershipTransferred(vtable._owner, newOwner);
        vtable._owner = newOwner;
    }

    /**
     * @dev VTableManagement
     */
    event VTableUpdate(bytes4 indexed selector, address oldImplementation, address newImplementation);

    function getFunction(VTableStore storage vtable, bytes4 selector) internal view returns (address) {
        return vtable._delegates[selector];
    }

    function setFunction(VTableStore storage vtable, bytes4 selector, address module) internal {
        emit VTableUpdate(selector, vtable._delegates[selector], module);
        vtable._delegates[selector] = module;
    }
}
