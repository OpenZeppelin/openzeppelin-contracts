pragma solidity ^0.4.23;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";


/**
 * @title Oracle
 * @dev Base contract supporting payments for oracle data.
 */
contract Oracle is Ownable {
  using SafeMath for uint256;

  struct OracleStorage {
    address oracle;       // oracle address
    uint256 amountOfUpdates; // needed amount of the updates 
    uint256[] oracleData; // storage to be updated by the oracle
    uint256 minFrequency; // minimum allowed frequency in seconds
    uint256 maxFrequency; // maximum allowed frequency in seconds
    uint256 reward;       // rewart to pay the oracle
    uint256 updatedAmount;// how many times data was updated
    uint256 lastUpdate;   // block.timestamp of the last update
  }

  OracleStorage public oracleStorage;
  bool activated;

  /**
   * @dev Constructor
   * @param _oracle        oracle address
   * @param _minFrequency  frequency of the updates - minimum in seconds
   * @param _maxFrequency  frequency of the updates - maximum in seconds
   * @param _reward        reward for the oracle
   */
  constructor(address _oracle, 
  uint256 _amountOfUpdates, 
  uint256 _minFrequency, 
  uint256 _maxFrequency, 
  uint256 _reward) public payable {
    require(_amountOfUpdates > 0);
    require(_minFrequency > 0);
    require(_reward > 0);
    require(_minFrequency <= _maxFrequency);

    oracleStorage.oracle = _oracle;
    oracleStorage.amountOfUpdates = _amountOfUpdates;
    oracleStorage.minFrequency = _minFrequency;
    oracleStorage.maxFrequency = _maxFrequency;
    oracleStorage.reward = _reward;
    oracleStorage.oracleData = new uint256[](_amountOfUpdates);
    oracleStorage.updatedAmount = 0;
    // solium-disable-next-line security/no-block-members
    oracleStorage.lastUpdate = block.timestamp;

    activated = false;
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
   * @dev Activate the contract - enabling oracle to start updating the data
   * Prerequisite: contract is funded
   */
  function activate() public onlyOwner {
    // Contract has to be sufficiently funded to be activated
    require(address(this).balance >= oracleStorage.reward);
    activated = true;
  }

  /**
   * @dev Check if contract is active
   */
  function isActive() public view returns (bool) {
    return activated;
  }

  /**
   * @dev Update the data by the oracle
   * @param   _value value to add
   */
  function addOracleData(uint256 _value) public onlyOracle {
    require(activated);
    // solium-disable-next-line security/no-block-members
    uint256 elapsedTime = block.timestamp.sub(oracleStorage.lastUpdate);
    require(elapsedTime <= oracleStorage.maxFrequency); 
    require(elapsedTime >= oracleStorage.minFrequency);

    oracleStorage.oracleData[oracleStorage.updatedAmount] = _value;
    oracleStorage.updatedAmount++;
    // solium-disable-next-line security/no-block-members
    oracleStorage.lastUpdate = block.timestamp;
  }

  /**
   * @dev Get oracle data
   */
  function getOracleData() public view returns (uint256[]) {
    return oracleStorage.oracleData;
  }

  /**
   * @dev Get a reward, called only by oracle
   * Prerequisite: all required updates happened
   */
  function claimReward() public onlyOracle {
    require(activated);
    require(oracleStorage.updatedAmount == oracleStorage.amountOfUpdates);
    oracleStorage.oracle.transfer(oracleStorage.reward);
    activated = false;
  }

  /**
   * @dev Cancel contract
   * Prerequisite: oracle missed the deadline (maxFrequeny was violated)
   */
  function cancelReward() public onlyOwner {
    require(activated);
    require(oracleStorage.updatedAmount != oracleStorage.amountOfUpdates);
    // solium-disable-next-line security/no-block-members
    uint256 elapsedTime = block.timestamp.sub(oracleStorage.lastUpdate);
    require(elapsedTime > oracleStorage.maxFrequency);
    owner.transfer(oracleStorage.reward);
    activated = false;
  }
}
