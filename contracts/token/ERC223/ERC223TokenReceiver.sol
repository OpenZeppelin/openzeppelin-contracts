pragma solidity ^0.4.9;


/**
 * @title ERC223 token handler
 * @dev see https://github.com/ethereum/eips/issues/223
 */
contract ERC223Receiver {

<<<<<<< HEAD
  struct TKN {
    address sender;
    //address origin;
    uint256 value;
    bytes data;
    bytes4 sig;
  }

  /**
  * @dev Fallback function. Transaction will fail if not implemented in receiver contract.
  * @param _from address from which the tokens are transfered.
  * @param _value uint256 amount of tokens to be transfered.
  * @param _data bytes data along token transaction.
  */
  function tokenFallback(address _from, uint256 _value, bytes _data) public pure {
    TKN memory tkn;
    tkn.sender = _from;
    //tkn.origin = _from;
    tkn.value = _value;
    tkn.data = _data;
    uint32 u = uint32(_data[3]) + (uint32(_data[2]) << 8) + (uint32(_data[1]) << 16) + (uint32(_data[0]) << 24);
    tkn.sig = bytes4(u);
    
    /**
    * tkn variable is analogue of msg variable of Ether transaction
    * tkn.sender is person who initiated this token transaction   (analogue of msg.sender)
    * tkn.value the number of tokens that were sent   (analogue of msg.value)
    * tkn.data is data of token transaction   (analogue of msg.data)
    * tkn.sig is 4 bytes signature of function
    * if data of token transaction is a function execution
    */
  }
=======
    struct TKN {
        address sender;
        uint256 value;
        bytes data;
        bytes4 sig;
    }

    /**
    * @dev Fallback function. Transaction will fail if not implemented in receiver contract.
    * @param _from address from which the tokens are transfered.
    * @param _value uint256 amount of tokens to be transfered.
    * @param _data bytes data along token transaction.
    */
    function tokenFallback(address _from, uint256 _value, bytes _data) public pure {
        TKN memory tkn;
        tkn.sender = _from;
        tkn.value = _value;
        tkn.data = _data;
        uint32 u = uint32(_data[3]) + (uint32(_data[2]) << 8) + (uint32(_data[1]) << 16) + (uint32(_data[0]) << 24);
        tkn.sig = bytes4(u);

        /**
        * tkn variable is analogue of msg variable of Ether transaction
        * tkn.sender is person who initiated this token transaction   (analogue of msg.sender)
        * tkn.value the number of tokens that were sent   (analogue of msg.value)
        * tkn.data is data of token transaction   (analogue of msg.data)
        * tkn.sig is 4 bytes signature of function
        * if data of token transaction is a function execution
        */
    }
>>>>>>> Added ERC223
}