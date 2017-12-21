pragma solidity ^0.4.18;

import "./ERC20.sol";
import "../math/SafeMath.sol";
import "../ECRecovery.sol";

/**
   @title ERC20Channels, State channels for ERC20 Tokens

   Contract that provides holders of a ERC20 compatible token the creation of
   channels between two users, once a channel is open the users can exchange
   signatures offchain to agree on the final value of the transfer.
   Uses OpenZeppelin ERC20 and SafeMath lib.
 */
contract ERC20Channels {
  using SafeMath for uint256;

  // Add recover method for bytes32 using ECRecovery lib from OpenZeppelin
  using ECRecovery for bytes32;

  // The ERC20 token to be used
  ERC20 public token;

  // The amount of time that a receiver has to challenge the sender
  uint256 public challengeTime;

  // The channels opened
  mapping (bytes32 => Channel) public channels;
  struct Channel {
    uint256 deposit;
    uint8 nonce;
  }

  // The requests from sender to close a channel
  mapping (bytes32 => ClosingRequest) public closingRequests;
  struct ClosingRequest {
    uint256 closingBalance;
    uint8 state;
    uint256 closeTime;
  }

  /*
   *  Events
   */

  event ChannelCreated(
    address indexed sender,
    address indexed receiver,
    uint8 indexed nonce,
    uint256 deposit
  );
  event ChannelCloseRequested(
    address indexed sender,
    address indexed receiver,
    uint8 indexed nonce,
    uint256 balance
  );
  event ChannelClosed(
    address indexed sender,
    address indexed receiver,
    uint8 indexed nonce,
    uint256 balance
  );

  /**
   * @dev Constructor
   * @param tokenAddress address, the address of the ERC20 token that will be used
   * @param _challengeTime uint256, the time that a channel has before ends
      with and uncoopertive close
   */
  function ERC20Channels(
    address tokenAddress,
    uint256 _challengeTime
  ) public {
    require(tokenAddress != address(0));
    require(_challengeTime >= 0);

    token = ERC20(tokenAddress);
    challengeTime = _challengeTime;
  }

  /**
   * @dev Creates a channel between the msg.sender and the receiver
   * @param receiver address, the receiver of the channel
   * @param deposit uint256, the balance taht I want to load in the channel
   * @param nonce uint8, the nonce number of the channel
   */
  function openChannel(
    address receiver,
    uint256 deposit,
    uint8 nonce
  ) external {

    require(nonce > 0);
    require(receiver != address(0));
    require(deposit > 0);

    // Create unique identifier from sender, receiver and current block timestamp
    bytes32 channelId = getChannelId(msg.sender, receiver, nonce);

    // Check taht teh channel not exist
    require(channels[channelId].deposit == 0);
    require(channels[channelId].nonce == 0);
    require(closingRequests[channelId].closeTime == 0);

    // Store channel information
    channels[channelId] = Channel({deposit: deposit, nonce: nonce});
    ChannelCreated(msg.sender, receiver, nonce, deposit);

    // transferFrom deposit from sender to contract
    // ! needs prior approval from user
    require(token.transferFrom(msg.sender, address(this), deposit));
  }

  /**
   * @dev Starts a close channel request form the sender
   * @param receiver address, the receiver of the channel
   * @param nonce uint8, the nonce number of the channel
   * @param balance uint256, the final balance of teh receiver
   */
  function uncooperativeClose(
    address receiver,
    uint8 nonce,
    uint256 balance
  ) external {
    bytes32 channelId = getChannelId(msg.sender, receiver, nonce);

    // Check that the closing request dont exist
    require(closingRequests[channelId].closeTime == 0);

    // Check that the balance is less that the deposited
    require(balance <= channels[channelId].deposit);

    // Mark channel as closed and create closing request
    closingRequests[channelId].closeTime = block.timestamp.add(challengeTime);
    require(closingRequests[channelId].closeTime > block.timestamp);
    closingRequests[channelId].closingBalance = balance;
    ChannelCloseRequested(msg.sender, receiver, nonce, balance);
  }

  /**
   * @dev Close a channel with the agreement of the sender and receiver
   * @param receiver address, the receiver of the channel
   * @param nonce uint8, the nonce number of the channel
   * @param balanceMsgSig bytes, the signature of the sender
   * @param closingSig bytes, the signature of the receiver
   */
  function cooperativeClose(
    address receiver,
    uint8 nonce,
    uint256 balance,
    bytes balanceMsgSig,
    bytes closingSig
  ) external {
    // Derive receiver address from signature
    bytes32 msgHash = keccak256(balanceMsgSig);
    require(receiver == msgHash.recover(closingSig));

    // Derive sender address from signed balance proof
    address sender = getSignerOfBalanceHash(receiver, nonce, balance, balanceMsgSig);

    close(sender, receiver, nonce, balance);
  }

  /**
   * @dev Close a channel with an existing closing request
   * @param receiver address, the receiver of the channel
   * @param nonce uint8, the nonce number of the channel
   */
  function closeChannel(address receiver, uint8 nonce) external {
    bytes32 channelId = getChannelId(msg.sender, receiver, nonce);

    // Check that the closing request was created
    require(closingRequests[channelId].closeTime > 0);

    // Make sure the challengeTime has ended
    require(block.timestamp > closingRequests[channelId].closeTime);

    close(msg.sender, receiver, nonce,
      closingRequests[channelId].closingBalance
    );
  }

  /**
   * @dev Get the channel info
   * @param sender address, the sender of the channel
   * @param receiver address, the receiver of the channel
   * @param nonce uint8, the nonce number of the channel
   */
  function getChannelInfo(
    address sender,
    address receiver,
    uint8 nonce
  ) external view returns (bytes32, uint256, uint256, uint256) {
    bytes32 channelId = getChannelId(sender, receiver, nonce);
    require(channels[channelId].nonce > 0);

    return (
      channelId,
      channels[channelId].deposit,
      closingRequests[channelId].closeTime,
      closingRequests[channelId].closingBalance
    );
  }

  /*
   *  Public functions
   */

  /**
   * @dev Get the signer of a balance hash signed
   * @param receiver address, the receiver to hash
   * @param nonce uint8, the nonce number of the channel
   * @param balance uint256, the balance to hash
   * @param msgSigned bytes, the balance hash signed
   */
  function getSignerOfBalanceHash(
    address receiver,
    uint8 nonce,
    uint256 balance,
    bytes msgSigned
  ) public view returns (address) {
    bytes32 msgHash = generateBalanceHash(receiver, nonce, balance);
    // Derive address from signature
    address signer = msgHash.recover(msgSigned);
    return signer;
  }

  /**
   * @dev Generate a hash balance for an address
   * @param receiver address, the receiver to hash
   * @param nonce uint8, the nonce number of the channel
   * @param balance uint256, the balance to hash
   */
  function generateBalanceHash(
    address receiver,
    uint8 nonce,
    uint256 balance
  ) public view returns (bytes32) {
    return keccak256(receiver, nonce, balance, address(this));
  }

  /**
   * @dev Generate a keccak256 hash
   * @param message bytes, the mesage to hash
   */
  function generateKeccak256(bytes message) public pure returns(bytes32) {
    return keccak256(message);
  }

  /**
   * @dev Generate a channel id
   * @param sender address, the sender in the channel
   * @param receiver address, the receiver in the channel
   * @param nonce uint8, the nonce number of the channel
   */
  function getChannelId(
    address sender,
    address receiver,
    uint8 nonce
  ) public pure returns (bytes32 data) {
    return keccak256(sender, receiver, nonce);
  }

  /*
   *  Internal functions
   */

  /**
   * @dev Close a channel
   * @param sender address, the sender in the channel
   * @param receiver address, the receiver in the channel
   * @param nonce uint8, the nonce number of the channel
   * @param receiverBalance uint256, the final balance of the receiver
   */
  function close(
    address sender,
    address receiver,
    uint8 nonce,
    uint256 receiverBalance
  ) internal {
    bytes32 channelId = getChannelId(sender, receiver, nonce);
    Channel memory channel = channels[channelId];

    require(channel.nonce > 0);
    require(receiverBalance <= channel.deposit);

    // Remove closed channel structures
    // channel.nonce will become 0
    // Change state before transfer call
    delete channels[channelId];
    delete closingRequests[channelId];

    // Send balance to the receiver, as it is always <= deposit
    require(token.transfer(receiver, receiverBalance));

    // Send deposit - balance back to sender
    require(token.transfer(sender, channel.deposit.sub(receiverBalance)));

    ChannelClosed(sender, receiver, nonce, receiverBalance);
  }

}
