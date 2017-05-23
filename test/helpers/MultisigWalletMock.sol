pragma solidity ^0.4.8;
import "../../contracts/MultisigWallet.sol";

contract MultisigWalletMock is MultisigWallet {
  uint public totalSpending;

  function MultisigWalletMock(address[] _owners, uint _required, uint _daylimit)
    MultisigWallet(_owners, _required, _daylimit) payable { }

  function changeOwner(address _from, address _to) external { }

}
