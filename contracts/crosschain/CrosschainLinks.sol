// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC7786GatewaySource} from "../interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "../utils/draft-InteroperableAddress.sol";
import {Bytes} from "../utils/Bytes.sol";
import {ERC7786Recipient} from "./ERC7786Recipient.sol";

/**
 * @dev Core bridging mechanism.
 *
 * This contract contains the logic to register and send messages to counterparts on remote chains using ERC-7786
 * gateways. It ensure received messages originate from a counterpart. This is the base of token bridges such as
 * {BridgeERC20Core}.
 *
 * Contract that inherit from this contract can use the internal {_sendMessageToCounterpart} to send messages to their
 * counterpart on a foreign chain. They must override the {_processMessage} function to handle the message that have
 * been verified.
 */
abstract contract CrosschainLinks is ERC7786Recipient {
    using Bytes for bytes;
    using InteroperableAddress for bytes;

    struct Link {
        address gateway;
        bytes counterpart;
    }
    mapping(bytes chain => Link) private _links;

    event LinkRegistered(address gateway, bytes counterpart);

    error LinkAlreadyRegistered(bytes chain);

    constructor(Link[] memory links) {
        for (uint256 i = 0; i < links.length; ++i) {
            _setLink(links[i].gateway, links[i].counterpart, false);
        }
    }

    /// @dev Returns the ERC-7786 gateway used for sending and receiving cross-chain messages to a given chain
    function getLink(bytes memory chain) public view virtual returns (address gateway, bytes memory counterpart) {
        Link storage self = _links[chain];
        return (self.gateway, self.counterpart);
    }

    /// @dev Internal setter to change the ERC-7786 gateway and counterpart for a given chain. Called at construction.
    function _setLink(address gateway, bytes memory counterpart, bool allowOverride) internal virtual {
        // Sanity check, this should revert if gateway is not an ERC-7786 implementation. Note that since
        // supportsAttribute returns data, an EOA would fail that test (nothing returned).
        IERC7786GatewaySource(gateway).supportsAttribute(bytes4(0));

        bytes memory chain = _extractChain(counterpart);
        if (allowOverride || _links[chain].gateway == address(0)) {
            _links[chain] = Link(gateway, counterpart);
            emit LinkRegistered(gateway, counterpart);
        } else {
            revert LinkAlreadyRegistered(chain);
        }
    }

    /// @dev Internal messaging function.
    function _sendMessageToCounterpart(
        bytes memory chain,
        bytes memory payload,
        bytes[] memory attributes
    ) internal virtual returns (bytes32) {
        (address gateway, bytes memory counterpart) = getLink(chain);
        return IERC7786GatewaySource(gateway).sendMessage(counterpart, payload, attributes);
    }

    /// @inheritdoc ERC7786Recipient
    function _isAuthorizedGateway(
        address instance,
        bytes calldata sender
    ) internal view virtual override returns (bool) {
        (address gateway, bytes memory router) = getLink(_extractChain(sender));
        return instance == gateway && sender.equal(router);
    }

    function _extractChain(bytes memory self) private pure returns (bytes memory) {
        (bytes2 chainType, bytes memory chainReference, ) = self.parseV1();
        return InteroperableAddress.formatV1(chainType, chainReference, hex"");
    }
}
