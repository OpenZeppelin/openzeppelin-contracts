pragma solidity ^0.5.0;

import "./GSNRecipientERC20Charge.sol";
import "../../token/ERC20/ERC20.sol";
import "../../token/ERC20/ERC20Detailed.sol";
import "../../ownership/Secondary.sol";

contract GSNRecipientERC20BuiltInCharge is GSNRecipientERC20Charge {
    constructor(string memory name, string memory symbol, uint8 decimals) public {
        _setToken(new __unstable__ERC20PrimaryAdmin(name, symbol, decimals));
    }

    function _getEquivalentTokens(uint256 weiAmount) internal view returns (uint256) {
        return weiAmount;
    }

    function _mintBuiltIn(address account, uint256 amount) internal {
        // Solidity doesn't allow converting contract types, so we need to go through the intermediate address type
        __unstable__ERC20PrimaryAdmin(address(token())).mint(account, amount);
    }
}

/**
 * @title __unstable__ERC20PrimaryAdmin
 * @dev An ERC20 token owned by another contract, which has minting permissions and can use transferFrom to receive
 * anyone's tokens. This contract is an internal helper for GSNRecipientERC20BuiltInCharge, and should not be used
 * outside of this context.
 */
// solhint-disable-next-line contract-name-camelcase
contract __unstable__ERC20PrimaryAdmin is ERC20, ERC20Detailed, Secondary {
    uint256 private constant UINT256_MAX = 2**256 - 1;

    constructor(string memory name, string memory symbol, uint8 decimals) ERC20Detailed(name, symbol, decimals) public { }

    // The primary account (GSNRecipientERC20BuiltInCharge) can mint tokens
    function mint(address account, uint256 amount) public onlyPrimary {
        _mint(account, amount);
    }

    // The primary account has 'infinite' allowance for all token holders
    function allowance(address owner, address spender) public view returns (uint256) {
        if (spender == primary()) {
            return UINT256_MAX;
        } else {
            return super.allowance(owner, spender);
        }
    }

    // Allowance for the primary account cannot be changed (it is always 'infinite')
    function _approve(address owner, address spender, uint256 value) internal {
        if (spender == primary()) {
            return;
        } else {
            super._approve(owner, spender, value);
        }
    }
}
