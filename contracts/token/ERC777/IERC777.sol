pragma solidity ^0.5.0;

/**
 * @title ERC777 token interface
 * @dev See https://eips.ethereum.org/EIPS/eip-777
 */
interface IERC777 {
    function authorizeOperator(address operator) external;

    function revokeOperator(address operator) external;

    function send(address to, uint256 amount, bytes calldata data) external;

    function operatorSend(
        address from,
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    function burn(uint256 amount, bytes calldata data) external;

    function operatorBurn(
        address from,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function totalSupply() external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

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
