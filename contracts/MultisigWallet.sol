pragma solidity ^0.4.8;


import "./ownership/Multisig.sol";
import "./ownership/Shareable.sol";
import "./DayLimit.sol";


/*
 * MultisigWallet
 * usage:
 * bytes32 h = Wallet(w).from(oneOwner).execute(to, value, data);
 * Wallet(w).from(anotherOwner).confirm(h);
 */
contract MultisigWallet is Multisig, Shareable, DayLimit {

  struct Transaction {
    address to;
    uint value;
    bytes data;
  }

  function MultisigWallet(address[] _owners, uint _required, uint _daylimit)       
    Shareable(_owners, _required)        
    DayLimit(_daylimit) { }

  // kills the contract sending everything to `_to`.
  function kill(address _to) onlymanyowners(sha3(msg.data)) external {
    suicide(_to);
  }

  // gets called when no other function matches
  function() payable {
    // just being sent some cash?
    if (msg.value > 0)
      Deposit(msg.sender, msg.value);
  }

  // Outside-visible transact entry point. Executes transaction immediately if below daily spend limit.
  // If not, goes into multisig process. We provide a hash on return to allow the sender to provide
  // shortcuts for the other confirmations (allowing them to avoid replicating the _to, _value
  // and _data arguments). They still get the option of using them if they want, anyways.
  function execute(address _to, uint _value, bytes _data) external onlyOwner returns (bytes32 _r) {
    // first, take the opportunity to check that we're under the daily limit.
    if (underLimit(_value)) {
      SingleTransact(msg.sender, _value, _to, _data);
      // yes - just execute the call.
      if (!_to.call.value(_value)(_data)) {
        throw;
      }
      return 0;
    }
    // determine our operation hash.
    _r = sha3(msg.data, block.number);
    if (!confirm(_r) && txs[_r].to == 0) {
      txs[_r].to = _to;
      txs[_r].value = _value;
      txs[_r].data = _data;
      ConfirmationNeeded(_r, msg.sender, _value, _to, _data);
    }
  }

  // confirm a transaction through just the hash. we use the previous transactions map, txs, in order
  // to determine the body of the transaction from the hash provided.
  function confirm(bytes32 _h) onlymanyowners(_h) returns (bool) {
    if (txs[_h].to != 0) {
      if (!txs[_h].to.call.value(txs[_h].value)(txs[_h].data)) {
        throw;
      }
      MultiTransact(msg.sender, _h, txs[_h].value, txs[_h].to, txs[_h].data);
      delete txs[_h];
      return true;
    }
  }

  function setDailyLimit(uint _newLimit) onlymanyowners(sha3(msg.data)) external {
    _setDailyLimit(_newLimit);
  }

  function resetSpentToday() onlymanyowners(sha3(msg.data)) external {
    _resetSpentToday();
  }


  // INTERNAL METHODS

  function clearPending() internal {
    uint length = pendingsIndex.length;
    for (uint i = 0; i < length; ++i) {
      delete txs[pendingsIndex[i]];
    }
    super.clearPending();
  }


  // FIELDS

  // pending transactions we have at present.
  mapping (bytes32 => Transaction) txs;
}
