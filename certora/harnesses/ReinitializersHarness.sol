// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";

contract MyTokenV1 is Initializable, ERC20Upgradeable {
    function initialize() initializer public {
        __ERC20_init("MyToken", "MTK");
    }
}

contract MyTokenV2 is Initializable, ERC20Upgradeable, ERC20PermitUpgradeable {
    function initializeV2() reinitializer(2) public {
        __ERC20Permit_init("MyToken");
    }
}