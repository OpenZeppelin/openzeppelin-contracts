// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "../../token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "../../token/ERC1155/extensions/ERC1155Burnable.sol";

contract ERC1155BurnableOverrideMock is ERC1155Burnable {
    address private immutable _forcedOperator;

    constructor(string memory uri_, address forcedOperator) ERC1155(uri_) {
        _forcedOperator = forcedOperator;
    }

    function mint(address account, uint256 id, uint256 value, bytes memory data) external {
        _mint(account, id, value, data);
    }

    function _checkAuthorized(address operator, address owner) internal view virtual override {
        if (operator != _forcedOperator) {
            revert ERC1155MissingApprovalForAll(operator, owner);
        }
    }
}
