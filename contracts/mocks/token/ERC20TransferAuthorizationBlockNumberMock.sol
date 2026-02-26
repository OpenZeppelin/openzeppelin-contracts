// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC20TransferAuthorization} from "../../token/ERC20/extensions/ERC20TransferAuthorization.sol";
import {Time} from "../../utils/types/Time.sol";

abstract contract ERC20TransferAuthorizationBlockNumberMock is ERC20TransferAuthorization {
    function clock() public view virtual override returns (uint48) {
        return Time.blockNumber();
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual override returns (string memory) {
        if (clock() != Time.blockNumber()) {
            revert ERC3009InconsistentClock();
        }
        return "mode=blocknumber&from=default";
    }
}
