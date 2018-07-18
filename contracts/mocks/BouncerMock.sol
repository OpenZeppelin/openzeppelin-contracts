pragma solidity ^0.4.24;

import "../access/Bouncer.sol";


contract BouncerMock is Bouncer {
  function checkValidTicket(address _delegate, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidTicket(_delegate, _sig);
  }

  function onlyWithValidTicket(bytes _sig)
    onlyValidTicket(address(this), _sig)
    public
    view
  {

  }

  function checkValidTicketAndMethod(address _delegate, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidTicketAndMethod(_delegate, _sig);
  }

  function onlyWithValidTicketAndMethod(bytes _sig)
    onlyValidTicketForMethod(address(this), _sig)
    public
    view
  {

  }

  function checkValidTicketAndData(
    address _delegate,
    bytes,
    uint,
    bytes _sig
  )
    public
    view
    returns (bool)
  {
    return isValidTicketAndData(_delegate, _sig);
  }

  function onlyWithValidTicketAndData(uint, bytes _sig)
    onlyValidTicketForData(address(this), _sig)
    public
    view
  {

  }

  function theWrongMethod(bytes)
    public
    pure
  {

  }
}
