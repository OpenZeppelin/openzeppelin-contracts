pragma solidity ^0.4.11;
import "../../contracts/MultisigWallet.sol";

contract MultisigWalletMock is MultisigWallet {
  uint256 public totalSpending;

  function MultisigWalletMock(address[] _owners, uint256 _required, uint256 _daylimit)
    MultisigWallet(_owners, _required, _daylimit) payable { }

  function changeOwner(address _from, address _to) external { }

}
