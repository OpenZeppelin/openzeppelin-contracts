pragma solidity ^0.4.24;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";


/**
 * @title Oracle
 * @dev Base contract supporting payments for oracle data.
 */
contract Oracle is Ownable {
  using SafeMath for uint256;

  /**
   * @dev Grouped oracle related information 
   */
  struct OracleStorage {
    address oracle;         // oracle address
    uint256 updatesNeeded;  // how many times data has to be updated 
    uint256[] oracleData;   // storage to be updated by the oracle
    uint256 reward;         // reward to pay the oracle
    uint256 updatesHappened;// how many times data was updated
  }

  OracleStorage public oracleStorage;
  bool activated;

  /**
   * @dev Constructor
   * @param _oracle        oracle address who could update the data
   * @param _updatesNeeded how many times data has to be updated
   * @param _reward        reward for the oracle
   */
  constructor(address _oracle, 
  uint256 _updatesNeeded, 
  uint256 _reward) public payable {
    require(_updatesNeeded > 0);
    require(_reward > 0);

    oracleStorage.oracle = _oracle;
    oracleStorage.updatesNeeded = _updatesNeeded;
    oracleStorage.reward = _reward;
    oracleStorage.oracleData = new uint256[](_updatesNeeded);
    oracleStorage.updatesHappened = 0;

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
   * @dev Accept funding the reward
   */
  function () public payable {}

  /**
   * @dev Activate the contract - enabling oracle to start updating the data
   * Prerequisite: contract is funded
   */
  function activate() public onlyOwner {
    // do not allow to activate twice
    require(!activated);
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
    require(oracleStorage.updatesHappened < oracleStorage.updatesNeeded);
    oracleStorage.oracleData[oracleStorage.updatesHappened] = _value;
    oracleStorage.updatesHappened++;
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
    require(oracleStorage.updatesHappened == oracleStorage.updatesNeeded);
    oracleStorage.oracle.transfer(oracleStorage.reward);
    activated = false;
  }

  /**
   * @dev Cancel contract
   * Prerequisite: oracle has not updated the data enough times
   */
  function cancelReward() public onlyOwner {
    require(activated);
    require(oracleStorage.updatesHappened != oracleStorage.updatesNeeded);
    owner.transfer(oracleStorage.reward);
    activated = false;
  }
}
