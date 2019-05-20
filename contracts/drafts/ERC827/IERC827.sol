pragma solidity ^0.5.2;


/**
 * @title ERC827 interface, an extension of ERC20 token standard
 *
 * @dev Interface of a ERC827 token, following the ERC20 standard with extra
 * methods to transfer value and data and execute calls in transfers and
 * approvals.
 */
interface IERC827 {

    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function approveAndCall(address _spender, uint256 _value, bytes calldata _data)
        external payable returns (bool);

    function transferAndCall(address _to, uint256 _value, bytes calldata _data)
        external payable returns (bool);

    function transferFromAndCall(
        address _from, address _to, uint256 _value, bytes calldata _data
    ) external payable returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}
