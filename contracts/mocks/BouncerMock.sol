pragma solidity ^0.4.24;

import "../access/Bouncer.sol";


contract BouncerMock is Bouncer {
  function checkValidTicket(address _address, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidTicket(address(this), _address, _sig);
  }

  function onlyWithValidTicket(bytes _sig)
    onlyValidTicket(address(this), _sig)
    public
    view
  {

  }

  function checkValidTicketAndMethod(address _address, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidTicketAndMethod(address(this), _address, _sig);
  }

  function onlyWithValidTicketAndMethod(bytes _sig)
    onlyValidTicketForMethod(address(this), _sig)
    public
    view
  {

  }

  function checkValidTicketAndData(
    address _address,
    bytes,
    uint,
    bytes _sig
  )
    public
    view
    returns (bool)
  {
    return isValidTicketAndData(address(this), _address, _sig);
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
