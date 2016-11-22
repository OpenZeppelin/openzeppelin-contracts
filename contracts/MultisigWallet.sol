pragma solidity ^0.4.4;


// interface contract for multisig proxy contracts; see below for docs.
contract multisig {
  // EVENTS

  // logged events:
  // Funds has arrived into the wallet (record how much).
  event Deposit(address _from, uint value);
  // Single transaction going out of the wallet (record who signed for it, how much, and to whom it's going).
  event SingleTransact(address owner, uint value, address to, bytes data);
  // Multi-sig transaction going out of the wallet (record who signed for it last, the operation hash, how much, and to whom it's going).
  event MultiTransact(address owner, bytes32 operation, uint value, address to, bytes data);
  // Confirmation still needed for a transaction.
  event ConfirmationNeeded(bytes32 operation, address initiator, uint value, address to, bytes data);


  // FUNCTIONS

  // TODO: document
  function changeOwner(address _from, address _to) external;
  function execute(address _to, uint _value, bytes _data) external returns (bytes32);
  function confirm(bytes32 _h) returns (bool);
}

// usage:
// bytes32 h = Wallet(w).from(oneOwner).execute(to, value, data);
// Wallet(w).from(anotherOwner).confirm(h);
contract Wallet is multisig, Shareable, daylimit {

  // TYPES

  // Transaction structure to remember details of transaction lest it need be saved for a later call.
  struct Transaction {
    address to;
    uint value;
    bytes data;
  }

  // METHODS

  // constructor - just pass on the owner array to the multiowned and
  // the limit to daylimit
  function Wallet(address[] _owners, uint _required, uint _daylimit)
  multiowned(_owners, _required) daylimit(_daylimit) {
  }

  // kills the contract sending everything to `_to`.
  function kill(address _to) onlymanyowners(sha3(msg.data)) external {
    suicide(_to);
  }

  // gets called when no other function matches
  function() {
    // just being sent some cash?
    if (msg.value > 0)
      Deposit(msg.sender, msg.value);
  }

  // Outside-visible transact entry point. Executes transaction immediately if below daily spend limit.
  // If not, goes into multisig process. We provide a hash on return to allow the sender to provide
  // shortcuts for the other confirmations (allowing them to avoid replicating the _to, _value
  // and _data arguments). They still get the option of using them if they want, anyways.
  function execute(address _to, uint _value, bytes _data) external onlyowner returns (bytes32 _r) {
    // first, take the opportunity to check that we're under the daily limit.
    if (underLimit(_value)) {
      SingleTransact(msg.sender, _value, _to, _data);
      // yes - just execute the call.
      _to.call.value(_value)(_data);
      return 0;
    }
    // determine our operation hash.
    _r = sha3(msg.data, block.number);
    if (!confirm(_r) && m_txs[_r].to == 0) {
      m_txs[_r].to = _to;
      m_txs[_r].value = _value;
      m_txs[_r].data = _data;
      ConfirmationNeeded(_r, msg.sender, _value, _to, _data);
    }
  }

  // confirm a transaction through just the hash. we use the previous transactions map, m_txs, in order
  // to determine the body of the transaction from the hash provided.
  function confirm(bytes32 _h) onlymanyowners(_h) returns (bool) {
    if (m_txs[_h].to != 0) {
      m_txs[_h].to.call.value(m_txs[_h].value)(m_txs[_h].data);
      MultiTransact(msg.sender, _h, m_txs[_h].value, m_txs[_h].to, m_txs[_h].data);
      delete m_txs[_h];
      return true;
    }
  }

  // INTERNAL METHODS

  function clearPending() internal {
    uint length = m_pendingIndex.length;
    for (uint i = 0; i < length; ++i)
    delete m_txs[m_pendingIndex[i]];
    super.clearPending();
  }

  // FIELDS

  // pending transactions we have at present.
  mapping (bytes32 => Transaction) m_txs;
}
