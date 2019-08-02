pragma solidity ^0.5.0;

import "./GSNBouncerBase.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Secondary.sol";
import "../../token/ERC20/SafeERC20.sol";
import "../../token/ERC20/ERC20.sol";
import "../../token/ERC20/ERC20Detailed.sol";

contract GSNBouncerERC20Fee is GSNBouncerBase {
    using SafeERC20 for __unstable__ERC20PrimaryAdmin;
    using SafeMath for uint256;

    enum GSNRecipientERC20ChargeErrorCodes {
        INSUFFICIENT_BALANCE,
        INSUFFICIENT_ALLOWANCE
    }

    __unstable__ERC20PrimaryAdmin private _token;

    constructor(string memory name, string memory symbol, uint8 decimals) public {
        _token = new __unstable__ERC20PrimaryAdmin(name, symbol, decimals);
    }

    function token() public view returns (IERC20) {
        return IERC20(_token);
    }

    function _mintBuiltIn(address account, uint256 amount) internal {
        _token.mint(account, amount);
    }

    function acceptRelayedCall(
        address,
        address from,
        bytes calldata,
        uint256,
        uint256,
        uint256,
        uint256,
        bytes calldata,
        uint256 maxPossibleCharge
    )
        external
        view
        returns (uint256, bytes memory)
    {
        if (_token.balanceOf(from) < maxPossibleCharge) {
            return _declineRelayedCall(uint256(GSNRecipientERC20ChargeErrorCodes.INSUFFICIENT_BALANCE));
        } else if (_token.allowance(from, address(this)) < maxPossibleCharge) {
            return _declineRelayedCall(uint256(GSNRecipientERC20ChargeErrorCodes.INSUFFICIENT_ALLOWANCE));
        }

        return _acceptRelayedCall(abi.encode(from, maxPossibleCharge));
    }

    function preRelayedCall(bytes calldata context) external returns (bytes32) {
        (address from, uint256 maxPossibleCharge) = abi.decode(context, (address, uint256));

        // The maximum token charge is pre-charged from the user
        _token.safeTransferFrom(from, address(this), maxPossibleCharge);
    }

    function postRelayedCall(bytes calldata context, bool, uint256 actualCharge, bytes32) external {
        (address from, uint256 maxPossibleCharge) = abi.decode(context, (address, uint256));

        // After the relayed call has been executed and the actual charge estimated, the excess pre-charge is returned
        _token.safeTransfer(from, maxPossibleCharge.sub(actualCharge));
    }
}

/**
 * @title __unstable__ERC20PrimaryAdmin
 * @dev An ERC20 token owned by another contract, which has minting permissions and can use transferFrom to receive
 * anyone's tokens. This contract is an internal helper for GSNRecipientERC20Fee, and should not be used
 * outside of this context.
 */
// solhint-disable-next-line contract-name-camelcase
contract __unstable__ERC20PrimaryAdmin is ERC20, ERC20Detailed, Secondary {
    uint256 private constant UINT256_MAX = 2**256 - 1;

    constructor(string memory name, string memory symbol, uint8 decimals) public ERC20Detailed(name, symbol, decimals) {
        // solhint-disable-previous-line no-empty-blocks
    }

    // The primary account (GSNRecipientERC20Fee) can mint tokens
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
