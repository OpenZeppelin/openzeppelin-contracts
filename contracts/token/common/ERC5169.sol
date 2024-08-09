// Smart Token Labs 2022 - 2024
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC165} from "../../utils/introspection/ERC165.sol";
import {IERC5169} from "./IERC5169.sol";

/**
 *  Tokenscript is a framework designed to make contract interaction easy.
 *  https://www.tokenscript.org/docs/TokenScript-Component.html
 *  A popular example of TokenScript usage is https://www.smartlayer.network/smartcat
 *  Users can use TokenScript viewer to open their own SmartCat NFTs and interact with the contract
 *  with TokenScript UI. UI and code embedded in the TokenScript file, thereby eliminating
 *  the need to create/host webpage or app to help user interact with the contract.
 *  TokenScript can automate most of contract interactions with and require a bit
 *  of coding on Svelte/React/VanillaJS
 */
abstract contract ERC5169 is IERC5169, ERC165 {
    /**
     *  @dev List of TokenScript files locations, related to this contract.
     */
    string[] private _scriptURI;

    /**
     *   @dev Return all TokenScriptURIs for the contract
     */
    function scriptURI() external view override returns (string[] memory) {
        return _scriptURI;
    }

    /**
        @dev Set/replace TokenScriptURIs
    */
    function setScriptURI(string[] memory newScriptURI) external override {
        _authorizeSetScripts(newScriptURI);

        _scriptURI = newScriptURI;

        emit ScriptUpdate(newScriptURI);
    }

    /**
     * @dev Required to let other contracts/services detect support of ERC5169
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC5169).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to set script URI. Called by
     * {setScriptURI}.
     *
     * Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.
     *
     * Implementation example for Ownable contract:
     * ```solidity
     * function _authorizeSetScripts(string[] memory) internal override onlyOwner {}
     * ```
     */
    function _authorizeSetScripts(string[] memory newScriptURI) internal virtual;
}
