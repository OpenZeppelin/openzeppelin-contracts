// Smart Token Labs 2022 - 2024
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 *   https://www.tokenscript.org/
 *   Standard for bridging Web2 and Web3
 *
 *   TokenScript is a JavaScript/WebAssembly/XML framework to improve functionality,
 *   security and usability of blockchain tokens in a myriad of ways.
 *   It allows token issuers and other trusted authorities to enrich a given token
 *   with a wide set of information, rules and functionalities.
 *   With TokenScript, wallets and web services can easily, securely and privately
 *   embed a token with all its functions, both on-chain and off-chain,
 *   without the need to understand the underlying smart contract.
 *
 *   ERC5169 required to attach script to a Smart Contract and then user can use
 *   user frindly UI to interact with Smart Contract and Web2 services
 */
interface IERC5169 {
    /**
     *   @dev Have to emit when scriptURIs updated
     */
    event ScriptUpdate(string[]);

    /**
     *   @dev Get all scriptURIs for the contract
     */
    function scriptURI() external view returns (string[] memory);

    /**
        @dev Replace scriptURIs with new ones
    */
    function setScriptURI(string[] memory) external;
}
