// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {CrosschainLinked} from "./CrosschainLinked.sol";

import {IERC7786GatewaySource} from "../interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "../utils/draft-InteroperableAddress.sol";
import {Bytes} from "../utils/Bytes.sol";
import {ERC7786Recipient} from "./ERC7786Recipient.sol";

import {Mode} from "../account/utils/draft-ERC7579Utils.sol";

abstract contract CrosschainRemoteController {
    using Bytes for bytes;
    using InteroperableAddress for bytes;

    mapping(bytes chain => CrosschainLinked.Link) private _links;

    constructor(CrosschainLinked.Link[] memory links) {
        for (uint256 i = 0; i < links.length; ++i) {
            _setLink(links[i].gateway, links[i].counterpart, false);
        }
    }

    function _crosschainExecute(bytes memory chain, Mode mode, bytes memory executionCalldata) internal virtual {
        (address gateway, bytes memory counterpart) = getLink(chain);
        IERC7786GatewaySource(gateway).sendMessage(
            counterpart,
            abi.encodePacked(mode, executionCalldata),
            new bytes[](0)
        );
    }

    /**
     * @dev Returns the ERC-7786 gateway used for sending and receiving cross-chain messages to a given chain.
     *
     * Note: The `chain` parameter is a "chain-only" InteroperableAddress (empty address) and the `counterpart` returns
     * the full InteroperableAddress (chain ref + address) that is on `chain`.
     */
    function getLink(bytes memory chain) public view virtual returns (address gateway, bytes memory counterpart) {
        CrosschainLinked.Link storage self = _links[chain];
        return (self.gateway, self.counterpart);
    }

    /**
     * @dev Internal setter to change the ERC-7786 gateway and counterpart for a given chain. Called at construction.
     *
     * Note: The `counterpart` parameter is the full InteroperableAddress (chain ref + address).
     */
    function _setLink(address gateway, bytes memory counterpart, bool allowOverride) internal virtual {
        // Sanity check, this should revert if gateway is not an ERC-7786 implementation. Note that since
        // supportsAttribute returns data, an EOA would fail that test (nothing returned).
        IERC7786GatewaySource(gateway).supportsAttribute(bytes4(0));

        (bytes2 chainType, bytes memory chainReference, ) = counterpart.parseV1();
        bytes memory chain = InteroperableAddress.formatV1(chainType, chainReference, hex"");
        if (allowOverride || _links[chain].gateway == address(0)) {
            _links[chain] = CrosschainLinked.Link(gateway, counterpart);
            emit CrosschainLinked.LinkRegistered(gateway, counterpart);
        } else {
            revert CrosschainLinked.LinkAlreadyRegistered(chain);
        }
    }
}
