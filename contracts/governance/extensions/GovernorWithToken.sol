// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";
import "../../token/ERC20/extensions/IComp.sol";

abstract contract GovernorWithToken is IGovernor {
    IComp immutable public token;

    constructor(IComp token_) {
        token = token_;
    }

    function getVotes(address account, uint256 blockNumber) public view virtual override returns(uint256) {
        return token.getPriorVotes(account, blockNumber);
    }
}
