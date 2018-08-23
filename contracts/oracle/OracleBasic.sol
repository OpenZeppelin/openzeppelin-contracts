pragma solidity ^0.4.24;

import "./Oracle.sol";
import "./OracleConsumer.sol";


contract OracleBasic is Oracle, OracleConsumer {

  /**
   * Result to update by an oracle 
   * result - actual holder of the data
   * exists - flag to indicate if data already exists
   */
  struct Result {
    bytes result;   // data to store
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

  function receiveResult(bytes32 _id, bytes _result) external {
    require(msg.sender == oracle, "Could be called only by an oracle");
    require(!resultExist(_id), "Id is not unique");
    results[_id].exists = true;
    results[_id].result = _result;
  }

  function resultFor(bytes32 _id) external view returns (bytes) {
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
