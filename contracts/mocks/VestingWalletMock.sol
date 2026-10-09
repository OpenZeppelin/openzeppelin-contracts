// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {VestingWallet} from "../finance/VestingWallet.sol";
import {VestingWalletCliff} from "../finance/VestingWalletCliff.sol";
import {ERC6372Utils} from "../utils/ERC6372Utils.sol";
import {Time} from "../utils/types/Time.sol";

abstract contract VestingWalletBlockNumberMock is VestingWallet {
    function clock() public view override returns (uint48) {
        return Time.blockNumber();
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view override returns (string memory) {
        return ERC6372Utils.blockNumberClockMode(clock());
    }
}

abstract contract VestingWalletCliffBlockNumberMock is VestingWalletCliff {
    function clock() public view override returns (uint48) {
        return Time.blockNumber();
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view override returns (string memory) {
        return ERC6372Utils.blockNumberClockMode(clock());
    }
}
