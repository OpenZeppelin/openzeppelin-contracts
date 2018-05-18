pragma solidity ^0.4.23;

/**
 * @name NonceTracker
 * @author Matt Condon (@shrugs)
 * @dev A simple way to keep track of nonces and restrict access.
 * @dev Use the `withAccess` modifier to restrict access by address.
 * @dev For example, withAccess(msg.sender, 1) will only allow once-per-address
 * @dev You can also accept nonces from users (as part of a hash you verify).
 */
contract NonceTracker {
  mapping(address => uint256) private nonces;

  modifier withAccess(address _address, uint256 _nonce)
  {
    access(_address, _nonce);
    _;
  }

  function nonce(address _address)
    public
    view
    returns (uint256)
  {
    return nonces[_address];
  }

  /**
   * @dev call this function when accepting a nonce
   * @dev throws if nonce is not strictly greater than previous nonce
   */
  function access(address _address, uint256 _nonce)
    internal
  {
    require(_nonce > nonces[_address]);
    nonces[_address] = _nonce;
  }
}
