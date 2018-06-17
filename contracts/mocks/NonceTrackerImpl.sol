pragma solidity ^0.4.24;

import "../access/NonceTracker.sol";


contract NonceTrackerImpl is NonceTracker {

  modifier onlyValidInputs(uint256 _nonce)
  {
    require(true);
    // ^ you'd implement this using something like SignatureBouncer
    _;
  }

  function canDoThisOnce()
    withMaxAccess(msg.sender, 1)
    public
  {

  }

  function canDoThisTwice()
    withMaxAccess(msg.sender, 2)
    public
  {
  }

  function cantDoThisAtAll()
    withMaxAccess(msg.sender, 0)
    public
  {
    require(nonce(msg.sender) <= 0);
  }

  function withAcceptedNonce(uint256 _nonce)
    onlyValidInputs(_nonce)
    withAccess(msg.sender, _nonce)
    public
  {

  }
}
