pragma solidity ^0.4.18;


import "./ownership/Ownable.sol";


/**
 * @title Searchable
 * @dev Allows a contract owner to associate search terms
 *      and messages with their contract.
 */
contract Searchable is Ownable {

  event AddSearchTerm(string indexed term, string message);
  event RemoveSearchTerm(string indexed term);

  /**
   * @dev Allows contract owner to add a search term and message.
   * @param term The search term to be added.
   * @param message The message to be added.
   */
  function addSearchTerm (string term, string message) public onlyOwner {
    AddSearchTerm(term, message);
  }

  /**
   * @dev Allows contract owner to remove a search term.
   * @param term The search term to be removed.
   */
  function removeSearchTerm (string term) public onlyOwner {
    RemoveSearchTerm(term);
  }
}
