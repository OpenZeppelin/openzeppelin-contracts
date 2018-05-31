pragma solidity ^0.4.23;

import "../math/SafeMath.sol";

/**
 * @title Oracle
 * @dev Base contract supporting payments for oracle data.
 */
contract Oracle {
  using SafeMath for uint256;

  struct OracleStorage {
    address oracle;
    uint256 amountOfUpdates;
    uint256[] oracleData;
    uint256 minFrequency;
    uint256 maxFrequency;
    uint256 reward;
    uint256 updatedAmount;
  }

  OracleStorage public oracleStorage;

  /**
   * @dev Constructor
   * @param _oracle        oracle address
   * @param _minFrequency  frequency of the updates - minimum in blocks
   * @param _maxFrequency  frequency of the updates - maximum in blocks
   * @param _reward        reward for the oracle
   */
  constructor(address _oracle, uint256 _amountOfUpdates, uint256 _minFrequency, uint256 _maxFrequency, uint256 _reward) public payable {
    require(_amountOfUpdates > 0);
    require(_minFrequency > 0);
    require(_reward > 0);

    oracleStorage.oracle = _oracle;
    oracleStorage.amountOfUpdates = _amountOfUpdates;
    oracleStorage.minFrequency = _minFrequency;
    oracleStorage.maxFrequency = _maxFrequency;
    oracleStorage.reward = _reward;
    oracleStorage.oracleData = new uint256[](_amountOfUpdates);
    oracleStorage.updatedAmount = 0;
  }

  /**
   * @dev Throw an exception if called by any account other than the oracle.
   */
  modifier onlyOracle() {
    require(msg.sender == oracleStorage.oracle);
    _;
  }

  /**
   * @dev Fund the reward for the oracle
   */
  function () public payable {}

  /**
   * @dev Update the data by the oracle
   * @param   _value value to add
   */
  function addOracleData(uint256 _value) public onlyOracle {
    oracleStorage.oracleData[oracleStorage.updatedAmount] = _value;
    oracleStorage.updatedAmount++;
  }

  /**
   * @dev Get oracle data
   */
  function getOracleData() public view returns (uint256[]) {
    return oracleStorage.oracleData;
  }

  /**
   * @dev Get oracle data
   */
  function getOracleDataByIndex(uint256 _index) public view returns (uint256) {
    return oracleStorage.oracleData[_index];
  }

}
