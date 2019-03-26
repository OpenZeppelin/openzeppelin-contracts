pragma solidity ^0.5.2;

import "../drafts/ERC777/IERC777.sol";
import "../drafts/ERC777/IERC777Sender.sol";
import "../introspection/ERC1820Client.sol";

/**
 * @title ERC777TokensSenderMock a contract that implements tokensToSend() hook
 * @author Bertrand Masius <github@catageeks.tk>
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-777.md
 */
contract ERC777SenderMock is IERC777Sender, ERC1820Client {

    address private _erc777;

    event TokensToSend(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    constructor(bool setInterface, address erc777) public {
        _erc777 = erc777;
        // register interface
        if (setInterface) {
            setInterfaceImplementer(
                address(this),
                keccak256("ERC777TokensSender"),
                address(this)
            );
        }
    }

    /**
     * @dev Send an amount of tokens from this contract to recipient
     * @param to address recipient address
     * @param amount uint256 amount of tokens to transfer
     * @param data bytes extra information provided by the token holder (if any)
     */
    function sendTokens(
        address to,
        uint amount,
        bytes calldata data
    ) external {
        // solhint-disable-next-line check-send-result
        IERC777(_erc777).send(to, amount, data);
    }

    /**
     * @dev Burn an amount of tokens from this contract
     * @param amount uint256 amount of tokens to transfer
     * @param data bytes extra information provided by the token holder (if any)
     */
    function burnTokens(uint amount, bytes calldata data) external {
        IERC777(_erc777).burn(amount, data);
    }

    /**
     * @dev Authorize an operator
     * @param operator address of operator
     */
    function authorizeOperator(address operator) external {
        IERC777(_erc777).authorizeOperator(operator);
    }

    /**
    * @dev tokensSender() hook
    * @param operator address operator requesting the transfer
    * @param from address token holder address
    * @param to address recipient address
    * @param amount uint256 amount of tokens to transfer
    * @param userData bytes extra information provided by the token holder (if any)
        * @param operatorData bytes extra information provided by the operator (if any)
            */
    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    )
    external
    {
        emit TokensToSend(
            operator,
            from,
            to,
            amount,
            userData,
            operatorData
        );
    }
}
