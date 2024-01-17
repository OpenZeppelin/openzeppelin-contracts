// Smart Token Labs 2022 - 2024
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./IERC5169.sol";

abstract contract ERC5169 is IERC5169 {
    string[] private _scriptURI;

    /**
    *   @dev Get all scriptURIs for the contract
    */
    function scriptURI() external view override returns (string[] memory) {
        return _scriptURI;
    }

    /**
        @dev Set new scriptURIs or replace scriptURIs with new ones
    */
    function setScriptURI(string[] memory newScriptURI) external override {
        _authorizeSetScripts(newScriptURI);

        _scriptURI = newScriptURI;

        emit ScriptUpdate(newScriptURI);
    }

    /**
     * @dev Required to let other contracts/services detect support of ERC5169
     */
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC5169).interfaceId;
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
