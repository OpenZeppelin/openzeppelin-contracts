// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MODULE_TYPE_VALIDATOR} from "../../../interfaces/IERC7579Module.sol";
import {AccountERC7579} from "../../../account/draft-AccountERC7579.sol";

contract MyModularAccount is AccountERC7579 {
    constructor(address module, bytes memory moduleInitData) {
        _installModule(MODULE_TYPE_VALIDATOR, module, moduleInitData);
    }
}
