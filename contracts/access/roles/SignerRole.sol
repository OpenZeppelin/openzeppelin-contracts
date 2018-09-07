pragma solidity ^0.4.24;

import "../Roles.sol";


contract SignerRole {
  using Roles for Roles.Role;

  event SignerAdded(address indexed account);
  event SignerRemoved(address indexed account);

  Roles.Role private signers;

  constructor() public {
    signers.add(msg.sender);
  }

  modifier onlySigner() {
    require(isSigner(msg.sender));
    _;
  }

  function isSigner(address _account) public view returns (bool) {
    return signers.has(_account);
  }

  function addSigner(address _account) public onlySigner {
    signers.add(_account);
    emit SignerAdded(_account);
  }

  function renounceSigner() public {
    signers.remove(msg.sender);
  }

  function _removeSigner(address _account) internal {
    signers.remove(_account);
    emit SignerRemoved(_account);
  }
}
