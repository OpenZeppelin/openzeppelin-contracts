pragma solidity ^0.4.18;

import "../access/SignatureBouncer.sol";


contract SignatureBouncerMock is SignatureBouncer {
  function initialize(address _sender)
    isInitializer("SignatureBouncerMock", "1.9.0-beta")
    public
  {
    SignatureBouncer.initialize(_sender);
  }

  function checkValidSignature(address _address, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidSignature(_address, _sig);
  }

  function onlyWithValidSignature(bytes _sig)
    onlyValidSignature(_sig)
    public
    view
  {

  }
}
