pragma solidity 0.4.24;

import "../signatures/SignatureDelegate.sol";
import "./BouncerMock.sol";


contract SignatureDelegateImpl is SignatureDelegate {

  bool public shouldPass = false;
  BouncerMock public bouncer;

  constructor (bool _shouldPass, BouncerMock _bouncer)
    public
  {
    shouldPass = _shouldPass;
    bouncer = _bouncer;
  }

  function isValidSignature(
    bytes32,
    bytes
  )
    public
    view
    returns (bool)
  {
    return shouldPass;
  }

  function forward()
    view
    public
  {
    require(bouncer.checkValidTicket(address(this), ""));
  }

}
