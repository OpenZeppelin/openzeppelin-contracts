pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./GSNBouncerBase.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Secondary.sol";
import "../../token/ERC20/SafeERC20.sol";
import "../../token/ERC20/ERC20.sol";
import "../../token/ERC20/ERC20Detailed.sol";

contract GSNBouncerERC20Fee is Initializable, GSNBouncerBase {
    using SafeERC20 for __unstable__ERC20PrimaryAdmin;
    using SafeMath for uint256;

    enum GSNBouncerERC20FeeErrorCodes {
        INSUFFICIENT_BALANCE
    }

    // We use a random storage slot to allow proxy contracts to enable GSN support in an upgrade without changing their
    // storage layout. This value is calculated as: keccak256('gsn.bouncer.signature.token'), minus 1.
    bytes32 constant private TOKEN_STORAGE_SLOT = 0xd918b70a5a5c95a8c0cac8acbdd59e1b4acd0645f53c0461d64b41f8825c8828;

    function initialize(string memory name, string memory symbol, uint8 decimals) public initializer {
        // TODO: Should we inject this token, instead of creating it, in order to make it upgradeable?
        // However, that would mean removing it from unstable and making in an official contract
        _setToken(new __unstable__ERC20PrimaryAdmin(name, symbol, decimals));
    }

    function token() public view returns (IERC20) {
        return IERC20(_getToken());
    }

    function _mint(address account, uint256 amount) internal {
        _getToken().mint(account, amount);
    }

    function acceptRelayedCall(
        address,
        address from,
        bytes calldata,
        uint256 transactionFee,
        uint256 gasPrice,
        uint256,
        uint256,
        bytes calldata,
        uint256 maxPossibleCharge
    )
        external
        view
        returns (uint256, bytes memory)
    {
        if (_getToken().balanceOf(from) < maxPossibleCharge) {
            return _rejectRelayedCall(uint256(GSNBouncerERC20FeeErrorCodes.INSUFFICIENT_BALANCE));
        }

        return _approveRelayedCall(abi.encode(from, maxPossibleCharge, transactionFee, gasPrice));
    }

    function _preRelayedCall(bytes memory context) internal returns (bytes32) {
        (address from, uint256 maxPossibleCharge) = abi.decode(context, (address, uint256));

        // The maximum token charge is pre-charged from the user
        _getToken().safeTransferFrom(from, address(this), maxPossibleCharge);
    }

    function _postRelayedCall(bytes memory context, bool, uint256 actualCharge, bytes32) internal {
        (address from, uint256 maxPossibleCharge, uint256 transactionFee, uint256 gasPrice) =
            abi.decode(context, (address, uint256, uint256, uint256));

        // actualCharge is an _estimated_ charge, which assumes postRelayedCall will use all available gas.
        // This implementation's gas cost can be roughly estimated as 10k gas, for the two SSTORE operations in an
        // ERC20 transfer.
        uint256 overestimation = _computeCharge(POST_RELAYED_CALL_MAX_GAS.sub(10000), gasPrice, transactionFee);
        actualCharge = actualCharge.sub(overestimation);

        // After the relayed call has been executed and the actual charge estimated, the excess pre-charge is returned
        _getToken().safeTransfer(from, maxPossibleCharge.sub(actualCharge));
    }

    function _getToken() private view returns (__unstable__ERC20PrimaryAdmin token) {
      bytes32 slot = TOKEN_STORAGE_SLOT;
      // solhint-disable-next-line no-inline-assembly
      assembly {
        token := sload(slot)
      }
    }

    function _setToken(__unstable__ERC20PrimaryAdmin token) private {
      bytes32 slot = TOKEN_STORAGE_SLOT;
      // solhint-disable-next-line no-inline-assembly
      assembly {
        sstore(slot, token)
      }
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

    constructor(string memory name, string memory symbol, uint8 decimals) public {
        Secondary.initialize(msg.sender);
        ERC20Detailed.initialize(name, symbol, decimals);
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

    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        if (recipient == primary()) {
            _transfer(sender, recipient, amount);
            return true;
        } else {
            return super.transferFrom(sender, recipient, amount);
        }
    }
}
