pragma solidity ^0.5.0;

/**
 * @dev Interface of the ERC777Tken standard as defined in the EIP.
 */
interface IERC777 {
    /**
     * @dev Returns the amount of tokens owned by an account (`owner`).
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to a specified
     * recipient (`to`).
     *
     * If send or receive hooks are registered for the caller and receiver,
     * the corresponding functions will be called with `data` and empty
     * `operatorData`. See `IERC777Sender` and `IERC777Recipient`.
     *
     * Emits a `Sent` event.
     */
    function send(address to, uint256 amount, bytes calldata data) external;

    /**
     * @dev Destoys `amount` tokens from the caller's account, reducing the
     * total supply.
     *
     * If a send hook is registered for the caller, the corresponding function
     * will be called with `data` and empty `operatorData`. See `IERC777Sender`.
     *
     * Emits a `Burned` event.
     */
    function burn(uint256 amount, bytes calldata data) external;

    function authorizeOperator(address operator) external;

    function revokeOperator(address operator) external;


    function operatorSend(
        address from,
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    function operatorBurn(
        address from,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function totalSupply() external view returns (uint256);

    function granularity() external view returns (uint256);

    function defaultOperators() external view returns (address[] memory);

    function isOperatorFor(address operator, address tokenHolder) external view returns (bool);

    event Sent(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    event Minted(address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData);

    event Burned(address indexed operator, address indexed from, uint256 amount, bytes data, bytes operatorData);

    event AuthorizedOperator(address indexed operator, address indexed tokenHolder);

    event RevokedOperator(address indexed operator, address indexed tokenHolder);
}
