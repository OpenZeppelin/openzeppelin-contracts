pragma solidity ^0.4.23;

import "../math/SafeMath.sol";

/**
 * @title Oracle
 * @dev Base contract supporting payments for oracle data.
 */
contract Oracle {
  using SafeMath for uint256;

  address public oracle;
  uint256 public minFrequency;
  uint256 public maxFrequency;
  uint256 public reward;

  mapping(string => uint256) internal oracleData;

  event DEBUG(address add, string what);

  /**
   * @dev Constructor
   * @param _oracle        oracle address
   * @param _minFrequency  frequency of the updates - minimum in blocks
   * @param _maxFrequency  frequency of the updates - maximum in blocks
   * @param _reward        reward for the oracle
   */
  constructor(address _oracle, uint256 _minFrequency, uint256 _maxFrequency, uint256 _reward) public payable {
    require(_minFrequency > 0);
    require(_reward > 0);

    oracle = _oracle;
    minFrequency = _minFrequency;
    maxFrequency = _maxFrequency;
    reward = _reward;
  }

  /**
   * @dev Throw an exception if called by any account other than the oracle.
   */
  modifier onlyOracle() {
    require(msg.sender == oracle);
    _;
  }

  /**
   * @dev Fund the reward for the oracle
   */
  function () public payable {}

  /**
   * @dev Update the data by the oracle
   * @param   _key key to update
   * @param   _value value to update
   */
  function updateData(string _key, uint256 _value) public onlyOracle {
    oracleData[_key] = _value;
  }

  /**
   * @dev Get the data
   * @param   _key key to get the data
   */
  function getData(string _key) public view returns (uint256) {
    return oracleData[_key];
  }
}
