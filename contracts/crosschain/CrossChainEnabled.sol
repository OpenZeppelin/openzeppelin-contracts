// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract CrossChainEnabled {
    error NotCrossChainCall();
    error InvalidCrossChainSender(address sender, address expected);

    modifier onlyCrossChain() {
        if (!_isCrossChain()) revert NotCrossChainCall();
        _;
    }

    modifier onlyCrossChainSender(address account) {
        address sender = _crossChainSender();
        if (account != sender) revert InvalidCrossChainSender(sender, account);
        _;
    }

    function _isCrossChain() internal view virtual returns (bool);

    function _crossChainSender() internal view virtual returns (address);
}
