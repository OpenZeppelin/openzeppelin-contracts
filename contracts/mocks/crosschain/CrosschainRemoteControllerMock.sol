// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {CrosschainRemoteController} from "../../crosschain/CrosschainRemoteController.sol";

contract CrosschainRemoteControllerMock is CrosschainRemoteController {
    constructor(CrosschainRemoteController.Link[] memory links) CrosschainRemoteController(links) {}
}
