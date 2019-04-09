pragma solidity ^0.5.2;

import "../drafts/ERC777/IERC777.sol";
import "../drafts/ERC777/IERC777Sender.sol";
import "../drafts/IERC1820Registry.sol";
import "../drafts/ERC1820Implementer.sol";

contract ERC777SenderMock is IERC777Sender, ERC1820Implementer {
    event TokensToSendCalled(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes data,
        bytes operatorData,
        address token,
        uint256 fromBalance,
        uint256 toBalance
    );

    bool private _shouldRevert;
    IERC1820Registry private _erc1820 = IERC1820Registry(0x1820b744B33945482C17Dc37218C01D858EBc714);

    bytes32 constant private TOKENS_SENDER_INTERFACE_HASH = keccak256("ERC777TokensSender");

    constructor(address account) public {
        if (account != address(0)) {
            _registerInterfaceForAddress(TOKENS_SENDER_INTERFACE_HASH, account);
        } else {
            address self = address(this);
            _registerInterfaceForAddress(TOKENS_SENDER_INTERFACE_HASH, self);
            _erc1820.setInterfaceImplementer(self, TOKENS_SENDER_INTERFACE_HASH, self);
        }
    }

    function tokensToSend(
        address operator,
        address from,
        address to,
        uint amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external {
        if (_shouldRevert) {
            revert();
        }

        IERC777 token = IERC777(msg.sender);

        uint256 fromBalance = token.balanceOf(from);
        // when called due to burn, to will be the zero address, which will have a balance of 0
        uint256 toBalance = token.balanceOf(to);

        emit TokensToSendCalled(
            operator,
            from,
            to,
            amount,
            userData,
            operatorData,
            address(token),
            fromBalance,
            toBalance
        );
    }

    function setShouldRevert(bool shouldRevert) public {
        _shouldRevert = shouldRevert;
    }

    function send(IERC777 token, address to, uint256 amount, bytes memory data) public {
        // This is 777's send function, not the Solidity send function
        token.send(to, amount, data); // solhint-disable-line check-send-result
    }

    function burn(IERC777 token, uint256 amount, bytes memory data) public {
        token.burn(amount, data);
    }
}

