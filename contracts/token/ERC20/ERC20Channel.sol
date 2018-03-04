pragma solidity ^0.4.18;

import "./ERC20.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Ownable.sol";
import "../../ECRecovery.sol";

/**
   @title ERC20Channel, State channel for ERC20 Tokens

   Contract that provides holders of a ERC20 compatible token the creation of a
   state channel between two users, once a channel is open the users can exchange
   signatures offchain to agree on the final value of the transfer.
   Uses OpenZeppelin ERC20 and SafeMath lib.

   Note: The owner of the contract is the sender, therefore it should be
    deployed by the sender itself.

   The channel can be closed in two ways: With and agreement or not.

   - Contract closed with an agreement:
     Can happen at anytime while the channel is still opened. Two signatures
     are needed for this, one is the signature of the receiver agreeing to
     receive a certain value, with the receiver signature the sender can now
     agree on the value and use sign the receiver signature.

      cooperativeClose(
       FinalBalance,
       Receiver.sign(FinalBalance),
       Sender.sign(SHA3( Receiver.sign(FinalBalance) ))
      )

   - Contract closed without agreement:
    This can happen only in behalf of the sender, and it has a time to be
     "challenged" by the receiver. The sender and receiver exchange signatures
     of a final value to be transfered but they reach a point where they dont
     agree on the final value. The sender can ask to close the channel with a
     final value, if the challenge time passes and the channel does not receive
     a cooperativeClose request it would be able to be closed by the sender
     transfering the final value requested.
 */
contract ERC20Channel is Ownable {
  using SafeMath for uint256;

  // Add recover method for bytes32 using ECRecovery lib from OpenZeppelin
  using ECRecovery for bytes32;

  // The ERC20 token to be used
  ERC20 public token;

  // The amount of time that a receiver has to challenge the sender
  uint256 public challengeTime;

  // The receiver of the tokens
  address public receiver;

  // The closing balance requested by the sender
  uint256 public closingBalance;

  // The timestamp of when the channel can be closed by the sender
  uint256 public closeTime;

  /**
   * @dev Constructor
   * @param tokenAddress address, the address of the ERC20 token that will be used
   * @param _receiver address, the address of the receiver
   * @param _challengeTime uint256, the time that a channel has before ends
    with an uncooperative close
   */
  function ERC20Channel(address tokenAddress, address _receiver, uint256 _challengeTime) public {
    require(tokenAddress != address(0));
    require(_receiver != address(0));
    require(_challengeTime >= 0);

    token = ERC20(tokenAddress);
    challengeTime = _challengeTime;
    receiver = _receiver;
  }

  /*
   *  External functions
   */

  /**
   * @dev Request an uncooperativeClose, it can be called only by the
    sender/owner. It will save the closing balance requested and start the
    challenge time period where the receiver can ask for a cooperativeClose.
   * @param balance uint256, the final balance of the receiver
   */
  function uncooperativeClose(uint256 balance) external onlyOwner {
    // Check that the closing request doesn't exist
    require(closeTime == 0);

    // Check that the balance is less or equal to the token balance
    require(balance <= token.balanceOf(address(this)));

    // Mark channel as closed and create closing request
    closeTime = now.add(challengeTime);
    closingBalance = balance;
  }

  /**
   * @dev Close a channel with the agreement of the sender and receiver
   * @param balance uint256, the final balance transfered of the channel
   * @param balanceMsgSig bytes, the signature of the sender.
    The msg signed by the receiver is generateBalanceHash(balance)
   * @param closingSig bytes, the signature of the receiver
    The msg signed by the sender is generateKeccak256(balanceMsgSig)
   */
  function cooperativeClose(uint256 balance, bytes balanceMsgSig, bytes closingSig) external {
    // Derive receiver address from signature
    require(receiver == keccak256(balanceMsgSig).recover(closingSig));

    // Derive sender address from signed balance proof
    address sender = getSignerOfBalanceHash(balance, balanceMsgSig);
    require(sender == owner);

    close(balance);
  }

  /**
   * @dev Close a channel with an uncooperativeClose already requested
   */
  function closeChannel() external onlyOwner {
    // Check that the closing request was created
    require(closeTime > 0);

    // Make sure the challengeTime has ended
    require(block.timestamp > closeTime);

    close(closingBalance);
  }

  /*
   *  Public functions
   */

   /**
    * @dev Get the channel info
    */
  function getInfo() public view returns (uint256, uint256, uint256) {
    return (token.balanceOf(address(this)), closeTime, closingBalance);
  }

  /**
   * @dev Get the signer of a balance hash signed
   * @param balance uint256, the balance to hash
   * @param msgSigned bytes, the balance hash signed
   */
  function getSignerOfBalanceHash(uint256 balance, bytes msgSigned) public view returns (address) {
    bytes32 msgHash = generateBalanceHash(balance);
    // Derive address from signature
    address signer = msgHash.recover(msgSigned);
    return signer;
  }

  /**
   * @dev Generate a hash balance for an address
   * @param balance uint256, the balance to hash
   */
  function generateBalanceHash(uint256 balance) public view returns (bytes32) {
    return keccak256(receiver, balance, address(this));
  }

  /**
   * @dev Generate a keccak256 hash
   * @param message bytes, the mesage to hash
   */
  function generateKeccak256(bytes message) public pure returns(bytes32) {
    return keccak256(message);
  }

  /*
   *  Internal functions
   */

  /**
   * @dev Close a channel
   * @param finalBalance uint256, the final balance of the receiver
   */
  function close(uint256 finalBalance) internal {
    uint256 tokenBalance = token.balanceOf(address(this));
    require(finalBalance <= tokenBalance);

    // Send balance to the receiver
    require(token.transfer(receiver, finalBalance));

    // Send remaining balance back to sender
    require(token.transfer(owner, tokenBalance.sub(finalBalance)));

    // Destroy contract
    selfdestruct(owner);
  }

}
