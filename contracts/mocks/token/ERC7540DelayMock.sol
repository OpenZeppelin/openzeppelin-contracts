// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC7540DelayDeposit} from "../../token/ERC20/extensions/ERC7540DelayDeposit.sol";
import {ERC7540DelayRedeem} from "../../token/ERC20/extensions/ERC7540DelayRedeem.sol";

abstract contract ERC7540DelayMock is ERC7540DelayDeposit, ERC7540DelayRedeem {
    function clock() public view virtual override(ERC7540DelayDeposit, ERC7540DelayRedeem) returns (uint48) {
        return super.clock();
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE()
        public
        view
        virtual
        override(ERC7540DelayDeposit, ERC7540DelayRedeem)
        returns (string memory)
    {
        return super.CLOCK_MODE();
    }

    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540DelayDeposit) {
        super._requestDeposit(assets, controller, owner, requestId);
    }

    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540DelayRedeem) {
        super._requestRedeem(shares, controller, owner, requestId);
    }
}

abstract contract ERC7540DelayShareOriginMock is ERC7540DelayMock {
    function _depositShareOrigin() internal view virtual override returns (address) {
        return address(this);
    }
}

abstract contract ERC7540DelayShareDestinationMock is ERC7540DelayMock {
    function _redeemShareDestination() internal view virtual override returns (address) {
        return address(this);
    }
}
