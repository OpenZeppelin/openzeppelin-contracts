pragma solidity ^0.4.24;

import "./Oracle.sol";
import "./OracleHandler.sol";


contract OracleBasic is Oracle, OracleHandler {

  /**
   * Result to update by an oracle 
   */
  struct Result {
    bytes32 result; // data to store
    bool exists;    // is data already exist
  }

  mapping (bytes32 => Result) public results;
  address public oracle;

  /**
   * @dev Constructor
   * @param _oracle the one who could update the results 
   */
  constructor(address _oracle) public {
    oracle = _oracle;
  }

  /**
   * @dev Receives data from an oracle
   * @param _id       id of the result
   * @param _result   result ot store
   */
  function receiveResult(bytes32 _id, bytes32 _result) external {
    require(msg.sender == oracle, "Could be called only by the oracle");
    require(!resultExist(_id), "Id is not unique");
    results[_id].exists = true;
    results[_id].result = _result;
  }

  /**
   * @dev Returns stored result
   * @param _id id of the result
   * @return    result
   */
  function resultFor(bytes32 _id) external view returns (bytes32 result) {
    require(resultExist(_id), "Data does not exists");
    return results[_id].result;
  }

  /**
   * @dev Checks if data already stored
   * @param _id     id of the result
   * @return bool
   */
  function resultExist(bytes32 _id) public view returns(bool exists) {
    return results[_id].exists;
  }
}
