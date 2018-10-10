pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "../Roles.sol";


contract SignerRole is Initializable {
  using Roles for Roles.Role;

  event SignerAdded(address indexed account);
  event SignerRemoved(address indexed account);

  Roles.Role private signers;

  function initialize(address sender) public initializer {
    if (!isSigner(sender)) {
      _addSigner(sender);
    }
  }

  modifier onlySigner() {
    require(isSigner(msg.sender));
    _;
  }

  function isSigner(address account) public view returns (bool) {
    return signers.has(account);
  }

  function addSigner(address account) public onlySigner {
    _addSigner(account);
  }

  function renounceSigner() public {
    _removeSigner(msg.sender);
  }

  function _addSigner(address account) internal {
    signers.add(account);
    emit SignerAdded(account);
  }

  function _removeSigner(address account) internal {
    signers.remove(account);
    emit SignerRemoved(account);
  }

  uint256[50] private ______gap;
}
