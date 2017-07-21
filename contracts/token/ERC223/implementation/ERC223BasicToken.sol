pragma solidity ^0.4.11;

import '../interface/ERC223Basic.sol';
import '../interface/ERC223ReceivingContract.sol';
import '../../../SafeMath.sol';

contract ERC223BasicToken is ERC223Basic{
    using SafeMath for uint;

    mapping(address => uint) balances;

    /**
     * @dev Fix for the ERC20 short address attack.
     */
    modifier onlyPayloadSize(uint size) {
        require(msg.data.length >= size + 4);
        _;
    }

    // Function that is called when a user or another contract wants to transfer funds .
    function transfer(address to, uint value, bytes data) onlyPayloadSize(2 * 32) {
        // Standard function transfer similar to ERC20 transfer with no _data .
        // Added due to backwards compatibility reasons .

        balances[msg.sender] = balances[msg.sender].sub(value);
        balances[to] = balances[to].add(value);
        if (isContract(to)){
            ERC223ReceivingContract receiver = ERC223ReceivingContract(to);
            receiver.tokenFallback(msg.sender, value, data);
        }
        // Trigger ERC223 event for new ERC223 compatible Ðapps
        Transfer(msg.sender, to, value, data);
    }

    // Standard function transfer similar to ERC20 transfer with no _data .
    // Added due to backwards compatibility reasons .
    function transfer(address to, uint value) {
        transfer(to, value, new bytes(0));
        // Trigger ERC20 event for compatibility with legacy ERC20 compatible only Ðapps
        Transfer(msg.sender, to, value);
    }

    function balanceOf(address _owner) constant returns (uint balance) {
        return balances[_owner];
    }

    //assemble the given address bytecode. If bytecode exists then the _address is a contract.
    function isContract(address _address) private returns (bool isContract) {
        // retrieve the size of the code on target address, this needs assembly
        uint length;
        assembly { length := extcodesize(_address) }
        return length > 0;
    }
}
