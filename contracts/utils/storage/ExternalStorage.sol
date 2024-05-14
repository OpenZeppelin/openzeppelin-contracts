// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "contracts/utils/storage/IStorage.sol";

library ExternalStorage {
    IExternalStorage private constant _STORAGE_CONTRACT =
        IExternalStorage(address(0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f));

    function writeUint(IStorage _key, uint256 _value) internal {
        _STORAGE_CONTRACT.writeUint(_key, _value);
    }

    function readUint(IStorage _key) internal view returns (uint256 value) {
        return _STORAGE_CONTRACT.readUint(_key);
    }

    function writeAddress(IStorage _key, address _value) internal {
        _STORAGE_CONTRACT.writeAddress(_key, _value);
    }

    function readAddress(IStorage _key) internal view returns (address value) {
        return _STORAGE_CONTRACT.readAddress(_key);
    }

    function writeBytes32(IStorage _key, bytes32 _value) internal {
        _STORAGE_CONTRACT.writeBytes32(_key, _value);
    }

    function readBytes32(IStorage _key) internal view returns (bytes32 value) {
        return _STORAGE_CONTRACT.readBytes32(_key);
    }

    function allowWritePermission(address accessor_, bool _hasWritePermission) internal {
        _STORAGE_CONTRACT.allowWritePermission(accessor_, _hasWritePermission);
    }
}

interface IExternalStorage {
    function writeUint(IStorage _key, uint256 _value) external;
    function readUint(IStorage _key) external view returns (uint256 value);
    function writeAddress(IStorage _key, address _value) external;
    function readAddress(IStorage _key) external view returns (address value);
    function writeBytes32(IStorage _key, bytes32 _value) external;
    function readBytes32(IStorage _key) external view returns (bytes32 value);
    function allowWritePermission(address accessor_, bool _hasWritePermission) external;
}

contract ExternalContract {
    bytes32 private constant _EXTERNAL_STORAGE = keccak256("src.repository.ExternalContract.v1");

    struct WritePermission {
        bool hasWritePermission;
    }

    modifier hasWritePermission() {
        require(read(msg.sender).hasWritePermission, "ExternalContractStorage: No write permission");
        _;
    }

    constructor() {
        WritePermission storage data = read(msg.sender);
        data.hasWritePermission = true;
    }

    function allowWritePermission(address accessor_, bool _hasWritePermission) external hasWritePermission {
        WritePermission storage data = read(accessor_);
        data.hasWritePermission = _hasWritePermission;
    }

    function read(address accessor_) internal pure returns (WritePermission storage data) {
        bytes32 slot = keccak256(abi.encodePacked(_EXTERNAL_STORAGE, accessor_));
        assembly {
            data.slot := slot
        }
    }

    function writeUint(IStorage _key, uint256 _value) external hasWritePermission {
        assembly {
            sstore(_key, _value)
        }
    }

    function readUint(IStorage _key) external view returns (uint256 value) {
        assembly {
            value := sload(_key)
        }
    }

    function writeAddress(IStorage _key, address _value) external hasWritePermission {
        assembly {
            sstore(_key, _value)
        }
    }

    function readAddress(IStorage _key) external view returns (address value) {
        assembly {
            value := sload(_key)
        }
    }

    function writeBytes32(IStorage _key, bytes32 _value) external hasWritePermission {
        assembly {
            sstore(_key, _value)
        }
    }

    function readBytes32(IStorage _key) external view returns (bytes32 value) {
        assembly {
            value := sload(_key)
        }
    }
}
