pragma solidity ^0.4.4;


/*
 * Multisig
 * Interface contract for multisig proxy contracts; see below for docs.
 */
contract Multisig {
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

