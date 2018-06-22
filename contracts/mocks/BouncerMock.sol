pragma solidity ^0.4.24;

import "../access/SignatureBouncer.sol";


contract SignatureBouncerMock is SignatureBouncer {
  function checkValidSignature(address _address, bytes memory _sig)
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

  function checkValidSignatureAndMethod(address _address, bytes memory _sig)
    public
    view
    returns (bool)
  {
    return isValidSignatureAndMethod(_address, _sig);
  }

  function onlyWithValidSignatureAndMethod(bytes _sig)
    onlyValidSignatureAndMethod(_sig)
    public
    view
  {

  }

  function checkValidSignatureAndData(address _address, bytes memory _bytes, uint _val, bytes memory _sig)
    public
    view
    returns (bool)
  {
    return isValidSignatureAndData(_address, _sig);
  }

  function onlyWithValidSignatureAndData(uint _val, bytes memory _sig)
    onlyValidSignatureAndData(_sig)
    public
    view
  {

  }
}
