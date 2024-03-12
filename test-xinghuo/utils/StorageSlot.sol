pragma solidity ^0.8.20;

import {StorageSlot} from "../../openzeppelin-contracts/contracts/utils/StorageSlot.sol";

contract MyStorageSlot{
    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 
    //address
    function setAddressSlot(address newImplementation) public {
        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }

    function getAddressSlot() public view returns (address) {
        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }
	
    //bool
    function setBooleanSlot(bool newImplementation) public {
        StorageSlot.getBooleanSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }

    function getBooleanSlot() public view returns (bool) {
        return StorageSlot.getBooleanSlot(_IMPLEMENTATION_SLOT).value;
    }

    //bytes32
    function setBytes32Slot(bytes32 newImplementation) public {
        StorageSlot.getBytes32Slot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }

    function getBytes32Slot() public view returns (bytes32) {
        return StorageSlot.getBytes32Slot(_IMPLEMENTATION_SLOT).value;
    }

    //uint256
    function setUint256Slot(uint256 newImplementation) public {
        StorageSlot.getUint256Slot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }

    function getUint256Slot() public view returns (uint256) {
        return StorageSlot.getUint256Slot(_IMPLEMENTATION_SLOT).value;
    }

    //string
    function setStringSlot(string memory newImplementation) public {
        StorageSlot.getStringSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }

    function getStringSlot() public view returns (string memory) {
        return StorageSlot.getStringSlot(_IMPLEMENTATION_SLOT).value;
    }

    //bytes
    function setBytesSlot(bytes memory newImplementation) public {
        StorageSlot.getBytesSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }

    function getBytesSlot() public view returns (bytes memory) {
        return StorageSlot.getBytesSlot(_IMPLEMENTATION_SLOT).value;
    }
}
