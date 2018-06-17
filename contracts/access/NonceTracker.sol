pragma solidity ^0.4.24;


/**
 * @title NonceTracker
 * @author Matt Condon (@shrugs)
 * @dev A simple way to keep track of nonces and restrict access.
 * @dev Use the `withAccess` modifier to restrict access by address.
 * @dev Use the `withMaxAccess` modifier to restrict access by address up to a max amount
 * @dev For example, withMaxAccess(msg.sender, 1) will only allow once-per-address.
 * @dev You can also accept nonces from users (as part of a hash you verify).
 */
contract NonceTracker {
  mapping(address => uint256) private nonces;

  modifier withAccess(address _address, uint256 _nonce)
  {
    access(_address, _nonce);
    _;
  }

  /**
   * @dev use withMaxAccess to restrict access per-address for a maxiumum
   * @dev number of times
   */
  modifier withMaxAccess(address _address, uint256 _maxNonce)
  {
    // require that we haven't accessed this resource too much
    require(nonce(_address) < _maxNonce);
    // access it once more by incrementing the nonce
    access(_address, nonce(_address) + 1);
    // allow access
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
