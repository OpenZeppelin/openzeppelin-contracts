pragma solidity ^0.4.0;

/*
 * TimedAction
 * Provides helper methods for invoking an action at a certain rate.
 * The action, code to get time stamp, and number of time units per interval
 * is up to the implementer.
 */

contract TimedAction {

  uint private currentTimeStamp;
  uint private intervalSize;

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
  // periodAction in a loop, to avoid reentrancy attacks
  function periodAction(uint times) private;

  // implement to define how to get the current time stamp
  // simple options are just to return `now` or the block number.
  function getTime() private returns (uint timeStamp);
}
