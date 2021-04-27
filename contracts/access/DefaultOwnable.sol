pragma solidity > 0.8.0;

import 'Ownable.sol';

contract DefaultOwnable is Ownable {
    
    constructor(address deployer) {
        _owner = deployer;
    }
}
