pragma solidity ^0.4.9;


import "./ERC223.sol";
import "./ERC223TokenReceiver.sol";
import "../../math/SafeMath.sol";


/**
* @title ERC223Token
* @dev Generic implementation for the required functionality of the ERC223 standard.
* @dev 
*/
contract ERC223Token is ERC223 {
    using SafeMath for uint256;
  
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balances;

    /**
    * @dev Function to access name of token.
    * @return _name string the name of the token.
    */
    function name() public view returns (string _name) {
        return name;
    }
    
    /**
    * @dev Function to access symbol of token.
    * @return _symbol string the symbol of the token.
    */
    function symbol() public view returns (string _symbol) {
        return symbol;
    }
    
    /**
    * @dev Function to access decimals of token.
    * @return _decimals uint8 decimal point of token fractions.
    */
    function decimals() public view returns (uint8 _decimals) {
        return decimals;
    }

    /**
    * @dev Function to access total supply of tokens.
    * @return _totalSupply uint256 total token supply.
    */
    function totalSupply() public view returns (uint256 _totalSupply) {
        return totalSupply;
    }

    /**
    * @dev Function to access the balance of a specific address.
    * @param _owner address the target address to get the balance from.
    * @return _balance uint256 the balance of the target address.
    */
    function balanceOf(address _owner) public view returns (uint256 _balance) {
        return balances[_owner];
    }

    /**
    * @dev Function that is called when a user or another contract wants to transfer funds using custom fallback.
    * @param _to address to which the tokens are transfered.
    * @param _value uint256 amount of tokens to be transfered.
    * @param _data bytes data along token transaction.
    * @param _fallback string name of the custom fallback function to be called after transaction.
    */
    function transfer(address _to, uint256 _value, bytes _data, string _fallback) public returns (bool _success) {
        if (isContract(_to)) {
            if (balanceOf(msg.sender) < _value) revert();
            balances[msg.sender] = balanceOf(msg.sender).sub(_value);
            balances[_to] = balanceOf(_to).add(_value);

            // Calls the custom fallback function.
            // Will fail if not implemented, reverting transaction.
            assert(_to.call.value(0)(bytes4(keccak256(_fallback)), msg.sender, _value, _data));

            Transfer(msg.sender, _to, _value, _data);
            return true;
        } else {
            return transferToAddress(_to, _value, _data);
        }
    }

    /**
    * @dev Function that is called when a user or another contract wants to transfer funds using default fallback.
    * @param _to address to which the tokens are transfered.
    * @param _value uint256 amount of tokens to be transfered.
    * @param _data bytes data along token transaction.
    */
    function transfer(address _to, uint256 _value, bytes _data) public returns (bool _success) {
        if (isContract(_to)) {
            return transferToContract(_to, _value, _data);
        } else {
            return transferToAddress(_to, _value, _data);
        }
    }

    /**
    * @dev Standard function transfer similar to ERC20 transfer with no _data.
    * Added due to backwards compatibility reasons.
    * @param _to address to which the tokens are transfered.
    * @param _value uint256 amount of tokens to be transfered.
    */
    function transfer(address _to, uint256 _value) public returns (bool _success) {
        // Adds empty bytes to fill _data param in functions
        bytes memory empty;
        if (isContract(_to)) {
            return transferToContract(_to, _value, empty);
        } else {
            return transferToAddress(_to, _value, empty);
        }
    }

    /**
    * @dev Function to test whether target address is a contract.
    * @param _addr address to be tested as a contract address or something else.
    * @return _isContract bool true if target address is a contract false otherwise.
    */
    function isContract(address _addr) private view returns (bool _isContract) {
        uint length;
        assembly {
            length := extcodesize(_addr)
        }
        return (length > 0);
    }
    
    /**
    * @dev Function that is called when transaction target is an address.
    * @param _to address to which the tokens are transfered.
    * @param _value uint256 amount of tokens to be transfered.
    * @param _data bytes data along token transaction.
    */
    function transferToAddress(address _to, uint256 _value, bytes _data) private returns (bool _success) {
        if (balanceOf(msg.sender) < _value) revert();
        balances[msg.sender] = balanceOf(msg.sender).sub(_value);
        balances[_to] = balanceOf(_to).add(_value);

        Transfer(msg.sender, _to, _value, _data);
        return true;
    }

    /**
    * @dev Function that is called when transaction target is a contract.
    * @param _to address to which the tokens are transfered.
    * @param _value uint256 amount of tokens to be transfered.
    * @param _data bytes data along token transaction.
    */
    function transferToContract(address _to, uint256 _value, bytes _data) private returns (bool _success) {
        if (balanceOf(msg.sender) < _value) revert();
        balances[msg.sender] = balanceOf(msg.sender).sub(_value);
        balances[_to] = balanceOf(_to).add(_value);

        // Calls the default fallback function.
        // Will fail if not implemented, reverting transaction.
        ERC223Receiver receiver = ERC223Receiver(_to);
        receiver.tokenFallback(msg.sender, _value, _data);

        Transfer(msg.sender, _to, _value, _data);
        return true;
    }
}