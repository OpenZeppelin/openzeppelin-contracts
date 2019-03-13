pragma solidity ^0.5.2;

import "../drafts/ERC1820Implementer.sol";

contract ERC1820MockImplementer is ERC1820Implementer {
    function implementsInterfaceForAddress(bytes32 interfaceHash, address account) public view returns (bool) {
        return _implementsInterfaceForAddress(interfaceHash, account);
    }

    function registerInterfaceForAddress(bytes32 interfaceHash, address account) public {
        _registerInterfaceForAddress(interfaceHash, account);
    }
}
