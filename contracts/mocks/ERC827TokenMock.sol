pragma solidity ^0.5.0;


import "../drafts/ERC827/ERC827.sol";


// mock class using ERC827 Token
contract ERC827TokenMock is ERC827 {

    constructor(address initialAccount, uint256 initialBalance) public ERC827() {
        _mint(initialAccount, initialBalance);
    }

}
