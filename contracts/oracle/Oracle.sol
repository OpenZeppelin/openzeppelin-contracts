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
   * @dev payable fallback to fund the reward for the oracle
   */
  function () public payable {}
}
