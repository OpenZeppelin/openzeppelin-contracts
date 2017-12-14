pragma solidity ^0.4.18;

import './ERC20Basic.sol';

/**
 *
 * @title ERC223Basic additions to ERC20Basic
 * @dev see also: https://github.com/ethereum/EIPs/issues/223               
 *
 * Created by IaM <DEV> (Elky Bachtiar) 
 * https://www.iamdeveloper.io
 *
 * file: ERC223Basic.sol
 * location: contracts/token/
 *
*/
contract ERC223Basic is ERC20Basic {
    function transfer(address _to, uint256 _value, bytes _data) public returns (bool success);
    function contractFallback(address _origin, address _to, uint _value, bytes _data) internal returns (bool success);
    function isContract(address _addr) internal returns (bool is_contract);
    event Transfer(address indexed _from, address indexed _to, uint256 _value, bytes indexed _data);
}
