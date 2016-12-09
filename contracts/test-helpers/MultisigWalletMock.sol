pragma solidity ^0.4.4;
import "../MultisigWallet.sol";

contract MultisigWalletMock is MultisigWallet {
  uint public totalSpending;

  function MultisigWalletMock(address[] _owners, uint _required, uint _daylimit)
    MultisigWallet(_owners, _required, _daylimit) { }

  function changeOwner(address _from, address _to) external { }

}
