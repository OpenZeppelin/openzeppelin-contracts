// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "contracts/utils/storage/IStorage.sol";
import "contracts/utils/storage/ExternalStorage.sol";

contract ExternalStorageTest is Test {
    using ExternalStorage for IStorage;

    function setUp() public {
        address externalStorage = address(new ExternalContract());
        IStorage key0 = IStorage.wrap(keccak256("setup0"));
        IStorage key1 = IStorage.wrap(keccak256("setup1"));
        IStorage key2 = IStorage.wrap(keccak256("setup2"));
        IStorage key3 = IStorage.wrap(keccak256("setup3"));
        IStorage key4 = IStorage.wrap(keccak256("setup4"));
        IStorage key5 = IStorage.wrap(keccak256("setup5"));
        IStorage key6 = IStorage.wrap(keccak256("setup6"));
        IStorage key7 = IStorage.wrap(keccak256("setup7"));

        bytes32 value = keccak256("value");

        key0.writeBytes32(value);
        key1.writeBytes32(value);
        key2.writeBytes32(value);
        key3.writeBytes32(value);
        key4.writeBytes32(value);
        key5.writeBytes32(value);
        key6.writeBytes32(value);
        key7.writeBytes32(value);
    }

    // @sucess_test
    function test_external_storage() public {
        // Arrange
        IStorage key = IStorage.wrap(keccak256("key"));
        bytes32 value = keccak256("value");

        // Act
        key.writeBytes32(value);

        // Assert
        assertEq(key.readBytes32(), value);
    }

    // @sucess_test
    function test_external_storage_multi_write() public {
        // Arrange
        IStorage key0 = IStorage.wrap(keccak256("key0"));
        IStorage key1 = IStorage.wrap(keccak256("key1"));
        IStorage key2 = IStorage.wrap(keccak256("key2"));
        IStorage key3 = IStorage.wrap(keccak256("key3"));
        IStorage key4 = IStorage.wrap(keccak256("key4"));
        bytes32 value = keccak256("value");

        // Act
        key0.writeBytes32(value);
        key1.writeBytes32(value);
        key2.writeBytes32(value);
        key3.writeBytes32(value);
        key4.writeBytes32(value);
    }

    // @sucess_test
    function test_external_storage_read() public {
        // Arrange
        IStorage key = IStorage.wrap(keccak256("setup0"));

        // Act
        bytes32 value = key.readBytes32();

        // Assert
        assertEq(value, keccak256("value"));
    }

    // @sucess_test
    function test_external_storage_read_multi() public {
        // Arrange
        IStorage key0 = IStorage.wrap(keccak256("setup0"));
        IStorage key1 = IStorage.wrap(keccak256("setup1"));
        IStorage key2 = IStorage.wrap(keccak256("setup2"));
        IStorage key3 = IStorage.wrap(keccak256("setup3"));
        IStorage key4 = IStorage.wrap(keccak256("setup4"));
        IStorage key5 = IStorage.wrap(keccak256("setup5"));
        IStorage key6 = IStorage.wrap(keccak256("setup6"));
        IStorage key7 = IStorage.wrap(keccak256("setup7"));

        // Act
        key0.readBytes32();
        key1.readBytes32();
        key2.readBytes32();
        key3.readBytes32();
        key4.readBytes32();
        key5.readBytes32();
        key6.readBytes32();
        key7.readBytes32();
    }
}
