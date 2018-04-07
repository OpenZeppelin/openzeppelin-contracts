pragma solidity ^0.4.18;

import "../Bouncer.sol";


contract BouncerMock is Bouncer {
  function checkValidSignature(address _address, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidSignature(_address, _sig);
  }
}
