// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC4626.sol)

pragma solidity ^0.8.20;

import {ERC20, IERC20} from "../ERC20.sol";
import {ERC4626} from "./ERC4626.sol";
import {IERC165} from "../../../interfaces/IERC165.sol";
import {IERC7540Operator} from "../../../interfaces/IERC7540.sol";
import {IERC7575} from "../../../interfaces/IERC7575.sol";

/**
 * @dev Implementation of the ERC-7540 "Asynchronous ERC-4626 Tokenized Vaults" as defined in
 * https://eips.ethereum.org/EIPS/eip-7540[ERC-7540].
 */
abstract contract BaseERC7540 is ERC4626, IERC7540Operator {
    /**
     * @dev Assume requests are non-fungible and all have ID = 0
     */
    uint256 internal constant REQUEST_ID = 0;

    /**
     * @dev See {IERC7540-isOperator}.
     */
    mapping(address => mapping(address => bool)) public isOperator;

    /**
     * @dev See {IERC7540-authorizations}.
     */
    mapping(address controller => mapping(bytes32 nonce => bool used)) public authorizations;

    /**
     * @dev Set the underlying asset contract. This must be an ERC20-compatible contract (ERC-20 or ERC-777).
     */
    constructor(IERC20 asset_) ERC4626(asset_) {}

    /**
     * @dev See {IERC7575-totalAssets}.
     */
    function totalAssets() public view virtual override returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    /**
     * @dev See {IERC7540-setOperator}.
     */
    function setOperator(address operator, bool approved) public virtual returns (bool success) {
        require(msg.sender != operator, "ERC7540Vault/cannot-set-self-as-operator");
        isOperator[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
        success = true;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public pure virtual returns (bool) {
        return interfaceId == type(IERC7575).interfaceId || interfaceId == type(IERC7540Operator).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }
}
