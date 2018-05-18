pragma solidity ^0.4.23;


contract NonceTracker {
  mapping(address => uint256) private nonces;

  modifier withAccess(address _address, uint256 _nonce)
  {
    access(_address, _nonce);
    _;
  }

  function nonce(address _address)
    public
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
