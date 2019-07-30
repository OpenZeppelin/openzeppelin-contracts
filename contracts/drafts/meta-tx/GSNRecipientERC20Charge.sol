pragma solidity ^0.5.0;

import "./GSNRecipient.sol";
import "../../math/SafeMath.sol";
import "../../token/ERC20/IERC20.sol";
import "../../token/ERC20/SafeERC20.sol";

contract GSNRecipientERC20Charge is GSNRecipient {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IERC20 private _token;

    enum GSNRecipientERC20ChargeErrorCodes {
        INSUFFICIENT_BALANCE,
        INSUFFICIENT_ALLOWANCE
    }

    function token() public view returns (IERC20) {
        return _token;
    }

    // We provide this as a function instead of a constructor to give more flexibility to derived contracts, which may
    // not receive the token address as an argument, or even deploy it themselves.
    function _setToken(IERC20 token_) internal {
        require(address(_token) == address(0), "ERC20Migrator: token already set");
        require(address(token_) != address(0), "ERC20Migrator: token is the zero address");

        _token = token_;
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
        uint256 maxTokenCharge = _getEquivalentTokens(maxPossibleCharge);

        if (_token.balanceOf(from) < maxTokenCharge) {
            return (_declineRelayedCall(uint256(GSNRecipientERC20ChargeErrorCodes.INSUFFICIENT_BALANCE)), "");
        } else if (_token.allowance(from, address(this)) < maxTokenCharge) {
            return (_declineRelayedCall(uint256(GSNRecipientERC20ChargeErrorCodes.INSUFFICIENT_ALLOWANCE)), "");
        }

        return (_acceptRelayedCall(), abi.encode(from, maxTokenCharge));
    }

    function preRelayedCall(bytes calldata context) external returns (bytes32) {
        (address from, uint256 maxTokenCharge) = abi.decode(context, (address, uint256));

        // The maximum token charge is pre-charged from the user
        _token.safeTransferFrom(from, address(this), maxTokenCharge);
    }

    function postRelayedCall(bytes calldata context, bool, uint256 actualCharge, bytes32) external {
        (address from, uint256 maxTokenCharge) = abi.decode(context, (address, uint256));

        // After the relayed call has been executed and the actual charge estimated, the excess pre-charge is returned
        _token.safeTransfer(from, maxTokenCharge.sub(actualCharge));
    }

    /**
     * @dev Converts an amount in wei to the equivalent number of tokens. This fucntion must be implemented by derived
     * contracts by specifying an exchange rate, which may e.g. be consulted from an oracle.
     */
    function _getEquivalentTokens(uint256 weiAmount) internal view returns (uint256);
}
