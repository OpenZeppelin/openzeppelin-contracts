pragma solidity ^0.4.21;


import "./ERC20Basic.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Blacklist.sol";


/**
 * @title Suspendable token
 * @dev Suspendable basic version of StandardToken, with no allowances.
 */
contract SuspendableToken is ERC20Basic, Blacklist {
  using SafeMath for uint256;

  struct Transaction {
    bytes32 txId;
    address from;
    address to;
    uint256 amount;
  }

  mapping(address => uint256) balances;
  mapping(address => Transaction[]) pendingTransfers;
  mapping(address => Transaction[]) pendingReceives;

  uint256 totalSupply_;

  event TransferCancelled(address _from, address _to, Transaction _tx);
  event TransferConfirmed(address _from, address _to, Transaction _tx);

  /**
  * @dev total number of tokens in existence
  */
  function totalSupply() public view returns (uint256) {
    return totalSupply_;
  }

  /**
  * @dev Transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0x0));
    require(_value <= balances[msg.sender]);
    require(balances[_to] + _value >= balances[_to]);

    bytes32 _txId = keccak256(msg.sender, _to, _value, block.timestamp, block.difficulty);
    Transaction memory tnx = Transaction(_txId, msg.sender, _to, _value);
    pendingTransfers[msg.sender].push(tnx);
    pendingReceives[_to].push(tnx);
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
   * @dev Cancel pending transfer for a specified transaction id
   * @param _txId The transaction id to be cancelled.
   */
  function cancelTransfer(bytes32 _txId) public returns (bool) {
    uint length = pendingTransfers[msg.sender].length;
    for (uint i = 0; i < length; i++) {
      var transaction = pendingTransfers[msg.sender][i];
      if (_txId == transaction.txId && msg.sender == transaction.from) {
        delete pendingTransfers[msg.sender][i];
        uint len = pendingReceives[transaction.to].length;
        for (uint k = 0; k < len; k++) {
          var tnx = pendingReceives[transaction.to][k];
          if (_txId == tnx.txId && transaction.to == tnx.to) {
            delete pendingReceives[transaction.to][k];
            emit TransferCancelled(msg.sender, transaction.to, transaction);
            return true;
          }
        }
        emit TransferCancelled(msg.sender, transaction.to, transaction);
        return true;
      }
    }
    return false;
  }

  /**
   * @dev confirm pending transaction to perform token transfer
   * @param _txId The transaction id to confirm.
   */
  function confirmTransfer(bytes32 _txId) public returns (bool) {
    uint length = pendingReceives[msg.sender].length;
    for (uint i = 0; i < length; i++) {
      var transaction = pendingReceives[msg.sender][i];
      if (_txId == transaction.txId && msg.sender == transaction.to) {
        if (transaction.to == address(0x0)) {
            revert();
        }
        if (transaction.amount > balances[transaction.from]) {
            revert();
        }
        if (balances[transaction.to] + transaction.amount < balances[transaction.to]) {
            revert();
        }
        balances[transaction.from] = balances[transaction.from].sub(transaction.amount);
        balances[msg.sender] = balances[msg.sender].add(transaction.amount);  
        if (blacklist[transaction.from]) {
            blacklist[msg.sender] = true;
        }
        delete pendingReceives[msg.sender][i];

        uint len = pendingTransfers[transaction.from].length;
        for (uint k = 0; k < len; k++) {
          tnx = pendingReceives[transaction.from][k];
          if (_txId == tnx.txId && transaction.from == tnx.from) {
            delete pendingTransfers[transaction.from][k];
            emit TransferConfirmed(transaction.from, msg.sender, transaction);
            return true;
          }
        }
        emit TransferConfirmed(transaction.from, msg.sender, transaction);
        return true;
      }
    }
    return false;
  }

  /**
   * @dev Get all pending transfer transactions of the sender
   */
  function getPendingTransfers() public returns (Transaction[]) {
      return pendingTransfers[msg.sender];
  }

  /**
   * @dev Get all pending receive transactions of the sender
   */
  function getPendingReceives() public returns (Transaction[]) {
      return pendingReceives[msg.sender];
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public view returns (uint256) {
    return balances[_owner];
  }

}
