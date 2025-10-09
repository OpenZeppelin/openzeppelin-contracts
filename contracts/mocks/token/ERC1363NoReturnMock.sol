// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC1363} from "../../token/ERC20/extensions/ERC1363.sol";

abstract contract ERC1363NoReturnMock is ERC1363 {
    function transferAndCall(address to, uint256 value, bytes memory data) public override returns (bool) {
        super.transferAndCall(to, value, data);
        assembly {
            return(0, 0)
        }
    }

    function transferFromAndCall(
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) public override returns (bool) {
        super.transferFromAndCall(from, to, value, data);
        assembly {
            return(0, 0)
        }
    }

    function approveAndCall(address spender, uint256 value, bytes memory data) public override returns (bool) {
        super.approveAndCall(spender, value, data);
        assembly {
            return(0, 0)
        }
    }
}
