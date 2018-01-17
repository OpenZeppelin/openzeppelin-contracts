pragma solidity ^0.4.18;


import './ownership/Ownable.sol';
import './math/SafeMath.sol';

 /**
  * @title Vault
  * @author Nick Johnson <arachnid at notdot.net>, Augusto Lemble <me@augustolemble.com>
  * Modified version of https://gist.github.com/Arachnid/86f4d183c36f5b05e55b771034dffe1b
  * @dev Ether vault contract. Stores ether with a 'time lock' on withdrawals,
  *      giving a user the chance to reclaim funds if an account is compromised.
  *      A recovery address has the ability to immediately destroy the wallet and
  *      send its funds to a new contract (such as a new vault, if the wallet)
  *      associated with this one is compromised or lost). A cold wallet or
  *      secure brain wallet should typically be used for this purpose.
  */
contract Vault is Ownable {
  using SafeMath for uint256;

  /**
   * @dev Recovery address for this vault.
   */
  address public recovery;

  /**
   * @dev Minimum interval between making an unvault call and allowing a
   *      withdrawal.
   */
  uint public withdrawDelay;

  /**
   * @dev Earliest time at which a withdrawal can be made.
   *      Valid iff withdrawAmount > 0.
   */
  uint public withdrawTime;

  /**
   * @dev Amount requested to be withdrawn.
   */
  uint public withdrawAmount;

  /**
   * @dev Throws if called by any account other than the recovery.
   */
  modifier onlyRecovery() {
    require(msg.sender == recovery);
    _;
  }

  /**
   * @dev Withdrawal request made
   */
  event Unvault(uint amount, uint when);

  /**
   * @dev Recovery key used to send all funds to `address`.
   */
  event Recover(address target, uint value);

  /**
   * @dev Recovery address changed form owner
   */
  event RecoveryChanged(address newRecovery);

  /**
   * @dev Funds deposited.
   */
  event Deposit(address from, uint value);

  /**
   * @dev Funds withdrawn.
   */
  event Withdraw(address to, uint value);

  /**
   * @dev Constructor.
   * @param _recovery The address of the recovery account.
   * @param _withdrawDelay The time (in seconds) between an unvault request
   *        and the earliest time a withdrawal can be made.
   */
  function Vault(address _recovery, uint _withdrawDelay) {
    recovery = _recovery;
    withdrawDelay = _withdrawDelay;
  }

  /**
   * @dev Fallback function that allows the contract to receive funds
   */
  function() public payable {
    require(msg.value > 0);
    Deposit(msg.sender, msg.value);
  }

  /**
   * @dev Request withdrawal of funds from the vault. Starts a timer for when
   *      funds can be withdrawn. Increases to the amount will reset the
   *      timer, but decreases can be made without changing it.
   * @param amount The amount requested for withdrawal.
   */
  function unvault(uint amount) public onlyOwner {
    require(amount <= this.balance);

    // Update the withdraw time if we're withdrawing more than previously.
    if (amount > withdrawAmount)
      withdrawTime = now.add(withdrawDelay);

    withdrawAmount = amount;
    Unvault(amount, withdrawTime);
  }

  /**
   * @dev Withdraw funds. Valid only after `unvault` has been called and the
   *      required interval has elapsed.
   */
  function withdraw() public onlyOwner {
    require(now > withdrawTime);
    require(withdrawAmount > 0);

    uint amount = withdrawAmount;
    withdrawAmount = 0;

    require(owner.send(amount));

    Withdraw(owner, amount);
  }

  /**
   * @dev Use the recovery address to send all funds to the nominated address
   *      and self-destruct this vault.
   * @param target The target address to send funds to.
   */
  function recover(address target) public onlyRecovery {
    Recover(target, this.balance);
    selfdestruct(target);
  }

  /**
   * @dev Allows the owner to change the recovery address in case of loss or  if
   *      he wants to change it.
   * @param newRecovery The new address to use as recovery
   */
  function changeRecovery(address newRecovery) public onlyOwner {
    RecoveryChanged(newRecovery);
    recovery = newRecovery;
  }

  /**
   * @dev Allows the owner to lock funds for longer than the default duration
   */
  function lock(uint duration) public onlyOwner {
    withdrawTime = withdrawTime.add(duration);
  }

}
