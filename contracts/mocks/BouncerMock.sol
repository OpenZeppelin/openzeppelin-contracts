pragma solidity ^0.4.24;

import "../access/SignatureBouncer.sol";


contract SignatureBouncerMock is SignatureBouncer {
  function checkValidSignature(address _address, bytes _signature)
    public
    view
    returns (bool)
  {
    return isValidSignature(_address, _signature);
  }

  function onlyWithValidSignature(bytes _signature)
    public
    onlyValidSignature(_signature)
    view
  {

  }

  function checkValidSignatureAndMethod(address _address, bytes _signature)
    public
    view
    returns (bool)
  {
    return isValidSignatureAndMethod(_address, _signature);
  }

  function onlyWithValidSignatureAndMethod(bytes _signature)
    public
    onlyValidSignatureAndMethod(_signature)
    view
  {

  }

  function checkValidSignatureAndData(
    address _address,
    bytes,
    uint,
    bytes _signature
  )
    public
    view
    returns (bool)
  {
    return isValidSignatureAndData(_address, _signature);
  }

  function onlyWithValidSignatureAndData(uint, bytes _signature)
    public
    onlyValidSignatureAndData(_signature)
    view
  {

  }

  function theWrongMethod(bytes)
    public
    pure
  {

  }
}
