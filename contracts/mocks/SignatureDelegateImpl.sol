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

  /**
   * @dev verifies that a signature of a hash is valid
   * @param _hash message hash that is signed
   * @param _sig the provided signature
   * @return bool validity of signature for the hash
   */
  function isValidSignature(
    bytes32 _hash,
    bytes _sig
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
