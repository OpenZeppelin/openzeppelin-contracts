// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC20MultiVotes} from "../../token/ERC20/extensions/ERC20MultiVotes.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";

abstract contract ERC20MultiVotesTimestampMock is ERC20MultiVotes {
    function clock() public view virtual override returns (uint48) {
        return SafeCast.toUint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual override returns (string memory) {
        return "mode=timestamp";
    }
}
