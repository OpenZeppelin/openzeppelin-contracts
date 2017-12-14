pragma solidity ^0.4.18;

/*
 * Base class contracts willing to accept ERC223 token transfers must conform to.
 *
 * Sender: msg.sender to the token contract, the address originating the token transfer.
 *         - For user originated transfers sender will be equal to tx.origin
 *        - For contract originated transfers, tx.origin will be the user that made the tx that produced the transfer.
 * Origin: the origin address from whose balance the tokens are sent
 *        - For transfer(), origin = msg.sender
 *        - For transferFrom() origin = _from to token contract
 * Value is the amount of tokens sent
 * Data is arbitrary data sent with the token transfer. Simulates ether tx.data
 *
 * From, origin and value shouldn't be trusted unless the token contract is trusted.
 * If sender == tx.origin, it is safe to trust it regardless of the token.
 *
 * file: ERC223Receiver.sol
 * location: contracts/token/
 *
*/
contract ERC223Receiver {
    function tokenFallback(address _sender, address _origin, uint256 _value, bytes _data) public returns (bool success);
}
