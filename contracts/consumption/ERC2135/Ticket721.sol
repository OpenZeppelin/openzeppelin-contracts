pragma solidity ^0.5.0;

import "./IERC2135.sol";
import "../../token/ERC721/ERC721Mintable.sol";

/**
 * @dev A reference implementation of EIP-2135.
 *
 * This implementation assumes the ticket is a ERC-721 token and can be transferred.
 */
contract Ticket721 is IERC2135, ERC721Mintable {

  mapping(uint256 => bool) private tickets;

  function issueTicket(address holder, uint256 ticketId) public {
    require (!tickets[ticketId]); // ticket needs to be not issued yet;
    require (isMinter(msg.sender), "Only minter can issue ticket.");
    _mint(holder, ticketId);
    tickets[ticketId] = true;
    emit OnTicketIssued(ticketId);
  }

  function consume(uint256 ticketId) public returns (bool success) {
    require (tickets[ticketId], "Ticket needs to be consumable.");
    require (msg.sender == ownerOf(ticketId), "Ticket should be held by tx sender to be consumed.");
    tickets[ticketId] = false;
    emit OnConsumption(ticketId);
    return true;
  }

  function isConsumable(uint256 ticketId) public view returns (bool consumable) {
    return tickets[ticketId];
  }

  event OnTicketIssued(uint256 indexed ticketId);
}
