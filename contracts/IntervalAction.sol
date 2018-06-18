pragma solidity ^0.4.0;

/*
 * IntervalAction
 * Provides helper methods for invoking an action at a certain rate.
 * The action, code to get time stamp, and number of time units per interval
 * is up to the implementer.
 */

contract IntervalAction {

  uint private currentTimeStamp;
  uint private intervalSize;

  function IntervalAction(uint iSize) {
    intervalSize = iSize;
    currentTimeStamp = getTime();
  }

  function calculateIntervalAndInvokeAction() internal {
    uint newTimeStamp = getTime();
    if (newTimeStamp < currentTimeStamp) {
      throw;
    }

    uint timeDelta = newTimeStamp - currentTimeStamp;
    currentTimeStamp = newTimeStamp - (newTimeStamp % intervalSize);
    periodAction(timeDelta / intervalSize);
  }

  // implement to define the action to be taken in each period
  // times determines how many times to repeat the action.
  // it is safer to pass this as a parameter rather than calling
  // periodAction repeatedly in a loop, to avoid reentrancy attacks
  // also saves gas -- number of iterations might be very long
  function periodAction(uint times) private;

  // WARNING: called before state updates, be careful about reentrancy
  // implement to define how to get the current time stamp
  // simple options are just to return `now` or the block number.
  function getTime() private returns (uint timeStamp);
}
