// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../utils/Create.sol";
import "../utils/introspection/ERC1820Implementer.sol";

contract CreateImpl {
    function deploy(uint256 value, bytes memory code) public {
        Create.deploy(value, code);
    }

    function deployERC1820Implementer(uint256 value) public {
        Create.deploy(value, type(ERC1820Implementer).creationCode);
    }

    function computeAddress(address addr, uint256 nonce) public pure returns (address) {
        return Create.computeAddress(addr, nonce);
    }

    receive() external payable {}
}
