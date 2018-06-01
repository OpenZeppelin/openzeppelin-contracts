pragma solidity ^0.4.23;

import "../access/SignatureBouncer.sol";


contract SignatureBouncerMock is SignatureBouncer {
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

  function checkValidSignatureAndData(address _address, uint _val, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidSignatureAndData(_address, _sig);
  }

  function checkValidSignatureAndMethod(address _address, bytes _sig)
    public
    view
    returns (bool)
  {
    return isValidSignatureAndMethod(_address, _sig);
  }
}
