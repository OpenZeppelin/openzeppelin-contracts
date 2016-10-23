pragma solidity ^0.4.0;
import './PullPayment.sol';

/*
 * Bounty
 * This bounty will pay out if you can cause a SimpleToken's balance
 * to be lower than its totalSupply, which would mean that it doesn't
 * have sufficient ether for everyone to withdraw.
 */

contract Target {
  function checkInvariant() returns(bool);
}

contract BytecodeDeployer {
    function createFromAddress(address _addr) returns (address){
      return createFromBytecode(msg.value, getByteCode(_addr));
    }

    // From http://solidity.readthedocs.io/en/latest/control-structures.html#opcodes
    function getByteCode(address _addr) returns (bytes o_code) {
      assembly {
        let size := extcodesize(_addr)
        o_code := mload(0x40)
        mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
        mstore(o_code, size)
        extcodecopy(_addr, add(o_code, 0x20), 0, size)
      }
    }

    // From https://gist.github.com/axic/fe2640e03fddea3f710d3856c20a579e
    function createFromBytecode(uint value, bytes bytecode) returns (address result) {
      assembly {
          let size := mload(bytecode)
          result := create(value, add(bytecode, 32), size)
      }
    }
}

contract Bounty is PullPayment, BytecodeDeployer {
  Target target;
  bool public claimed;
  mapping(address => address) public researchers;

  function() {
    if (claimed) throw;
  }

  function createTarget(address targetAddress) returns(Target) {
    target = Target(createFromAddress(targetAddress));
    researchers[target] = msg.sender;
    return target;
  }

  function checkInvariant() returns(bool){
    return target.checkInvariant();
  }

  function claim(Target target) {
    address researcher = researchers[target];
    if (researcher == 0) throw;
    // Check Target contract invariants
    if (!target.checkInvariant()) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}
