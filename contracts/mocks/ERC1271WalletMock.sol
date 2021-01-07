// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../access/Ownable.sol";
import "../cryptography/ECDSA.sol";
import "../interfaces/IERC1271.sol";

contract ERC1271WalletMock is Ownable, IERC1271 {
    constructor(address originalOwner) public {
        transferOwnership(originalOwner);
    }

    function isValidSignature(bytes32 hash, bytes memory signature) public view override returns (bytes4 magicValue) {
        return ECDSA.recover(hash, signature) == owner() ? this.isValidSignature.selector : bytes4(0);
    }
}
