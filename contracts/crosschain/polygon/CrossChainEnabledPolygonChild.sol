// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../CrossChainEnabled.sol";
import "../../security/ReentrancyGuard.sol";
import "../../utils/Address.sol";
import "../../vendor/polygon/IFxMessageProcessor.sol";

address constant DEFAULT_SENDER = 0x000000000000000000000000000000000000dEaD;

abstract contract CrossChainEnabledPolygonChild is IFxMessageProcessor, CrossChainEnabled, ReentrancyGuard {
    address private immutable _fxChild;
    address private _sender = DEFAULT_SENDER;

    constructor(address fxChild) {
        _fxChild = fxChild;
    }

    function _isCrossChain() internal view virtual override returns (bool) {
        return msg.sender == _fxChild;
    }

    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return _sender;
    }

    /**
     * @dev Non reentrancy is crutial to avoid a cross-chain call being able
     * to impersonnate anyone by just looping through this with user defined
     * arguments.
     *
     * Note: if _fxChild calls anyother function that does a delegate-call,
     * then security could be compromised.
     */
    function processMessageFromRoot(
        uint256, /* stateId */
        address rootMessageSender,
        bytes calldata data
    ) external override nonReentrant {
        require(msg.sender == _fxChild, "unauthorized cross-chain relay");

        _sender = rootMessageSender;
        Address.functionDelegateCall(address(this), data, "crosschain execution failled");
        _sender = DEFAULT_SENDER;
    }
}
