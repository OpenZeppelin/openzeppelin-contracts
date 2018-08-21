pragma solidity ^0.4.24;

import "../introspection/ERC165Checker.sol";


/**
  * solidity-coverage creates EVM events and
  * those use the 0x40 free memory pointer (FMP), which conflicts with the implementation
  * of ERC165Checker which uses inline assembly and also uses the FMP.
  *
  * So instead of checking return results, we check to see if the funciton throws or not.
  *
  * See https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1086#issuecomment-411944571
  *  or https://github.com/sc-forks/solidity-coverage/pull/52 for details.
  */
contract ERC165CheckerMock {
  using ERC165Checker for address;

  function supportsERC165(address _address)
    public
    view
  {
    require(_address.supportsERC165(), "nope");
  }

  function supportsERC165Interface(address _address, bytes4 _interfaceId)
    public
    view
  {
    require(_address.supportsERC165Interface(_interfaceId), "nope");
  }

  function supportsInterface(address _address, bytes4 _interfaceId)
    public
    view
  {
    require(_address.supportsInterface(_interfaceId), "nope");
  }

  function supportsInterfaces(address _address, bytes4[] _interfaceIds)
    public
    view
  {
    require(_address.supportsInterfaces(_interfaceIds), "nope");
  }
}
