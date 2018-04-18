pragma solidity ^0.4.21;


import "../ERC20/ERC20.sol";


/**
 * @title ERC827 interface, an extension of ERC20 token standard
 *
 * @dev Interface of a ERC827 token, following the ERC20 standard with extra
 * @dev methods to transfer value and data and execute calls in transfers and
 * @dev approvals.
 */
contract ERC827 is ERC20 {
  function approve(address _spender, uint256 _value, bytes _data) public returns (bool);
  function transfer(address _to, uint256 _value, bytes _data) public returns (bool);
  function transferFrom(
    address _from,
    address _to,
    uint256 _value,
    bytes _data
  )
    public
    returns (bool);
}
