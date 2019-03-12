pragma solidity ^0.5.2;

import "../drafts/ERC1820.sol";

contract ERC1820Mock is ERC1820 {
    function implementsInterfaceForAddress(bytes32 interfaceHash, address account) public view returns (bool) {
        return _implementsInterfaceForAddress(interfaceHash, account);
    }

    function registerInterfaceForAddress(bytes32 interfaceHash, address account) public {
        _registerInterfaceForAddress(interfaceHash, account);
    }
}
