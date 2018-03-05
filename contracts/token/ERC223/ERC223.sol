pragma solidity ^0.4.9;


/**
 * @title ERC223 interface
 * @dev see https://github.com/ethereum/eips/issues/223
 */
contract ERC223 {
    function transfer(address _to, uint _value) public returns (bool _success);
    function transfer(address _to, uint _value, bytes _data) public returns (bool _success);
    function transfer(address _to, uint _value, bytes _data, string _fallback) public returns (bool _success);
    event Transfer(address indexed _from, address indexed _to, uint _value, bytes indexed _data);
}