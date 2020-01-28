pragma solidity ^0.6.0;

import "../../GSN/Context.sol";
import "../Roles.sol";

contract SignerRole is Context {
    using Roles for Roles.Role;

    event SignerAdded(address indexed account);
    event SignerRemoved(address indexed account);

    Roles.Role private _signers;

    constructor () internal {
        _addSigner(_msgSender());
    }

    modifier onlySigner() {
        require(isSigner(_msgSender()), "SignerRole: caller does not have the Signer role");
        _;
    }

    function isSigner(address account) public view returns (bool) {
        return _signers.has(account);
    }

    function addSigner(address account) public virtual onlySigner {
        _addSigner(account);
    }

    function renounceSigner() public virtual {
        _removeSigner(_msgSender());
    }

    function _addSigner(address account) internal virtual {
        _signers.add(account);
        emit SignerAdded(account);
    }

    function _removeSigner(address account) internal virtual {
        _signers.remove(account);
        emit SignerRemoved(account);
    }
}
