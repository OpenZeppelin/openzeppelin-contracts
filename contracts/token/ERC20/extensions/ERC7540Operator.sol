// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC20Vault} from "./ERC20Vault.sol";
import {IERC7540Operator} from "../../../interfaces/IERC7540.sol";
import {ERC165} from "../../../utils/introspection/ERC165.sol";
import {IERC20} from "../IERC20.sol";

/**
 * @dev Base implementation for ERC-7540 asynchronous vaults with operator support.
 *
 * This contract extends {ERC20Vault} with operator functionality as defined in ERC-7540.
 * Operators can manage requests on behalf of controllers, enabling delegation of vault operations
 * such as requesting deposits/redemptions and claiming assets/shares.
 *
 * The operator pattern is similar to ERC-20 approvals but applies to all request operations.
 * Controllers can approve or revoke operator permissions using {setOperator}.
 *
 * [CAUTION]
 * ====
 * Operators have extensive permissions. An operator approved by a controller can:
 *
 * * Request deposits using the controller's assets
 * * Request redemptions using the controller's shares
 * * Claim assets or shares on behalf of the controller
 *
 * Users should only approve operators they fully trust with both their assets and shares.
 * ====
 */
abstract contract ERC7540Operator is ERC165, ERC20Vault, IERC7540Operator {
    /// @dev The operator is not the caller or an operator of the controller
    error ERC7540InvalidOperator(address controller, address operator);

    mapping(address => mapping(address => bool)) private _isOperator;

    /// @dev See {_checkOperatorOrController}.
    modifier onlyOperatorOrController(address controller, address operator) {
        _checkOperatorOrController(controller, operator);
        _;
    }

    /**
     * @dev Sets the underlying asset contract. See {ERC20Vault-constructor}.
     */
    constructor(IERC20 asset_) ERC20Vault(asset_) {}

    /// @inheritdoc IERC7540Operator
    function isOperator(address controller, address operator) public view returns (bool status) {
        return _isOperator[controller][operator];
    }

    /// @inheritdoc ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC7540Operator).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IERC7540Operator
    function setOperator(address operator, bool approved) public returns (bool) {
        _setOperator(_msgSender(), operator, approved);
        return true;
    }

    /**
     * @dev Set the `operator` status for the `controller` to the `approved` value
     *
     * Emits an {OperatorSet} event if the approval status changes.
     */
    function _setOperator(address controller, address operator, bool approved) internal {
        if (_isOperator[controller][operator] != approved) {
            _isOperator[controller][operator] = approved;
            emit OperatorSet(controller, operator, approved);
        }
    }

    /// @dev Reverts if the `operator` is not the caller or an operator of the `controller`
    function _checkOperatorOrController(address controller, address operator) internal view virtual {
        require(
            controller == operator || isOperator(controller, operator),
            ERC7540InvalidOperator(controller, operator)
        );
    }
}
