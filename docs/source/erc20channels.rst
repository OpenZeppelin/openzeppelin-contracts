ERC20Channels
=============================================

Contract that provides holders of a ERC20 compatible token the creation of
channels between two users, once a channel is open the users can exchange
signatures offchain to agree on the final value of the transfer.

ERC20Channels(address tokenAddress, uint256 _challengeTime)
""""""""""""""""""""""""""""""""""""""
Sets the token address and challenge time to be used.

function openChannel(address receiver, uint256 deposit, uint8 nonce)
""""""""""""""""""""""""""""""""""""""
Creates a channel between the msg.sender and the receiver

function uncooperativeClose(address receiver, uint8 nonce, uint256 balance)
""""""""""""""""""""""""""""""""""""""
Starts a close channel request form the sender

function cooperativeClose(address receiver, uint8 nonce, uint256 balance, bytes balanceMsgSig, bytes closingSig)
""""""""""""""""""""""""""""""""""""""
Close a channel with the agreement of the sender and receiver

function closeChannel(address receiver, uint8 nonce)
""""""""""""""""""""""""""""""""""""""
Close a channel with an existing closing request

function getChannelInfo(address sender, address receiver, uint8 nonce)
""""""""""""""""""""""""""""""""""""""
Get the channel info

function getSignerOfBalanceHash( address receiver, uint8 nonce, uint256 balance, bytes msgSigned)
""""""""""""""""""""""""""""""""""""""
Get the signer of a balance hash signed with a generated hash on chain

generateBalanceHash(address receiver, uint8 nonce, uint256 balance)
""""""""""""""""""""""""""""""""""""""
Generates a hash balance for an addres

function generateKeccak256(bytes message)
""""""""""""""""""""""""""""""""""""""
Generates a keccak256 hash

function getChannelId(address sender, address receiver, uint8 nonce)
""""""""""""""""""""""""""""""""""""""
Generates a channel id
