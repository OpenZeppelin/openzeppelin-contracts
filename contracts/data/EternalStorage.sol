pragma solidity ^0.4.13;

import "../lifecycle/Pausable.sol";

/**
 * @title Contract that store data in behalf of another contract
 * @author SylTi inspired from colony blog post https://blog.colony.io/writing-upgradeable-contracts-in-solidity-6743f0eecc88
 * @dev This contract should be used in combinaison of other strategies to make your contract upgradeable
 * like encapsulating logic into libraries.
 */

contract EternalStorage is Pausable {
  mapping(bytes32 => uint) public UIntValues;
  mapping(bytes32 => int) public IntValues;
  mapping(bytes32 => string) public StringValues;
  mapping(bytes32 => address) public AddressValues;
  mapping(bytes32 => bytes) public BytesValues;
  mapping(bytes32 => bytes32) public Bytes32Values;
  mapping(bytes32 => bool) public BooleanValues;

  function EternalStorage() {
  }

  /**
   * @dev change the value inside UIntValues for the given key 
   * @param record sha3 key
   * @param value new value is uint
   */
  function setUIntValue(bytes32 record, uint value) public onlyOwner {
    UIntValues[record] = value;
  }

  /**
   * @dev delete the value inside UIntValues for the given key 
   * @param record sha3 key
   */
  function deleteUIntValue(bytes32 record) public onlyOwner {
    delete UIntValues[record];
  }

  /**
   * @dev change the value inside IntValues for the given key 
   * @param record sha3 key
   * @param value new value is int
   */
  function setIntValue(bytes32 record, int value) public onlyOwner {
    IntValues[record] = value;
  }

  /**
   * @dev delete the value inside IntValues for the given key 
   * @param record sha3 key
   */
  function deleteIntValue(bytes32 record) public onlyOwner {
    delete IntValues[record];
  }

  /**
   * @dev change the value inside StringValues for the given key 
   * @param record sha3 key
   * @param value new value is string
   */
  function setStringValue(bytes32 record, string value) public onlyOwner {
    StringValues[record] = value;
  }

  /**
   * @dev delete the value inside StringValues for the given key 
   * @param record sha3 key
   */
  function deleteStringValue(bytes32 record) public onlyOwner {
    delete StringValues[record];
  }

  /**
   * @dev change the value inside AddressValues for the given key 
   * @param record sha3 key
   * @param value new value is address
   */
  function setAddressValue(bytes32 record, address value) public onlyOwner {
    AddressValues[record] = value;
  }

  /**
   * @dev delete the value inside AddressValues for the given key 
   * @param record sha3 key
   */
  function deleteAddressValue(bytes32 record) public onlyOwner {
    delete AddressValues[record];
  }

  /**
   * @dev change the value inside BytesValues for the given key 
   * @param record sha3 key
   * @param value new value is bytes
   */
  function setBytesValue(bytes32 record, bytes value) public onlyOwner {
    BytesValues[record] = value;
  }

  /**
   * @dev delete the value inside BytesValues for the given key 
   * @param record sha3 key
   */
  function deleteBytesValue(bytes32 record) public onlyOwner {
    delete BytesValues[record];
  }

  /**
   * @dev change the value inside Bytes32Values for the given key 
   * @param record sha3 key
   * @param value new value is bytes32
   */
  function setBytes32Value(bytes32 record, bytes32 value) public onlyOwner {
    Bytes32Values[record] = value;
  }

  /**
   * @dev delete the value inside Bytes32Values for the given key 
   * @param record sha3 key
   */
  function deleteBytes32Value(bytes32 record) public onlyOwner {
    delete Bytes32Values[record];
  }

  /**
   * @dev change the value inside BooleanValues for the given key 
   * @param record sha3 key
   * @param value new value is bool
   */
  function setBooleanValue(bytes32 record, bool value) public onlyOwner {
    BooleanValues[record] = value;
  }

  /**
   * @dev delete the value inside BooleanValues for the given key 
   * @param record sha3 key 
   */
  function deleteBooleanValue(bytes32 record) public onlyOwner {
    delete BooleanValues[record];
  }

}