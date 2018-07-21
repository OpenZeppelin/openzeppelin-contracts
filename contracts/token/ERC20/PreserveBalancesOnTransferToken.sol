pragma solidity ^0.4.24;

import "./MintableToken.sol";
import "./BurnableToken.sol";

/**
 * @title PreserveBalancesOnTransferToken (Copy-on-Write) token 
 * @author Based on code by Thetta DAO Framework: https://github.com/Thetta/Thetta-DAO-Framework/
 * @dev Token that can preserve the balances after some EVENT happens (voting is started, didivends are calculated, etc)
 * without blocking the transfers! Please notice that EVENT in this case has nothing to do with Ethereum events.
 *
 * Example of usage (pseudocode):
 *   token.mint(ADDRESS_A, 100);
 *   assert.equal(token.balanceOf(ADDRESS_A), 100);
 *   assert.equal(token.balanceOf(ADDRESS_B), 0);
 *
 *   uint someEventID_1 = token.startNewEvent();
 *   token.transfer(ADDRESS_A, ADDRESS_B, 30);
 *
 *   assert.equal(token.balanceOf(ADDRESS_A), 70);
 *   assert.equal(token.balanceOf(ADDRESS_B), 30);
 *
 *   assert.equal(token.getBalanceAtEvent(someEventID_1, ADDRESS_A), 100);
 *   assert.equal(token.getBalanceAtEvent(someEventID_1, ADDRESS_B), 0);
 *
 *   token.finishEvent(someEventID_1);
 */
contract PreserveBalancesOnTransferToken is MintableToken, BurnableToken {
  struct Holder {
        uint256 balance;
        uint lastUpdateTime;
    }

  struct Event {
      mapping (address => Holder) holders;
      
      bool isEventInProgress;
      uint eventStartTime;
  }
  mapping (uint => Event) events;

  event EventStarted(address indexed _address, uint _eventID);
  event EventFinished(address indexed _address, uint _eventID);

// BasicToken overrides:
  /**
  * @dev Transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    updateCopyOnWriteMaps(msg.sender, _to);
    return super.transfer(_to, _value);
  }

// StandardToken overrides:
  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    updateCopyOnWriteMaps(_from, _to);
    return super.transferFrom(_from, _to, _value);
  }

// MintableToken overrides:
  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) canMint onlyOwner public returns(bool){
    updateCopyOnWriteMap(_to);
    return super.mint(_to, _amount);
  }

// BurnableToken overrides:
  /** @dev This is an override of internal method! Public method burn() calls _burn() automatically
	* (see BurnableToken implementation)
	*/
  function _burn(address _who, uint256 _value) internal {
    updateCopyOnWriteMap(_who);
    super._burn(_who, _value);
  }

// PreserveBalancesOnTransferToken - new methods:
  /**
   * @dev Function to signal that some event happens (dividends are calculated, voting, etc) 
	* so we need to start preserving balances AT THE time this event happened.
   * @return An index of the event started.
   */
  function startNewEvent() public onlyOwner returns(uint){
    for(uint i = 0; i < 20; i++){
      if(!events[i].isEventInProgress){
        events[i].isEventInProgress = true;
        events[i].eventStartTime = now;

        emit EventStarted(msg.sender, i);
        return i;
      }
    }
    revert(); //all slots busy at the moment
  }

  /**
   * @dev Function to signal that some event is finished 
   * @param _eventID An index of the event that was previously returned by startNewEvent().
   */
  function finishEvent(uint _eventID) public onlyOwner {
    require(events[_eventID].isEventInProgress);
    events[_eventID].isEventInProgress = false;

    emit EventFinished(msg.sender, _eventID);
  }
  
  /**
   * @dev Returns the balance of the address _for at the time event _eventID happened
   * !!! WARNING !!! 
   * We do not give STRONG guarantees. The return value is time-dependent:
   * If startNewEvent() is called and then immediately getBalanceAtEventStart() -> it CAN return wrong data 
   * In case time between these calls has passed -> the return value is ALWAYS correct.
   *
   * Please see tests. 
   * return Token balance (when the event started, but not a CURRENT balanceOf()!)
   */
  function getBalanceAtEventStart(uint _eventID, address _for) public view returns(uint256) {
    require(events[_eventID].isEventInProgress);

    if(!isBalanceWasChangedAfterEventStarted(_eventID, _for)){
      return balances[_for];
    }

    return events[_eventID].holders[_for].balance;
  }

// Internal methods:
  function updateCopyOnWriteMaps(address _from, address _to) internal {
    updateCopyOnWriteMap(_to);
    updateCopyOnWriteMap(_from);
  }

  function updateCopyOnWriteMap(address _for) internal {
    for(uint i = 0; i < 20; i++){
      bool res = isNeedToUpdateBalancesMap(i, _for);
      if(res){
        events[i].holders[_for].balance = balances[_for];
        events[i].holders[_for].lastUpdateTime = now;
      }
    }
  }

  function isNeedToUpdateBalancesMap(uint _eventID, address _for) internal view returns(bool) {
    return events[_eventID].isEventInProgress && !isBalanceWasChangedAfterEventStarted(_eventID, _for);
  }

  function isBalanceWasChangedAfterEventStarted(uint _eventID, address _for) internal view returns(bool){
    return (events[_eventID].holders[_for].lastUpdateTime >= events[_eventID].eventStartTime);
  }
}
