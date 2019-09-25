pragma solidity ^0.5.0;

import "../utils/SafeCast.sol";

contract SafeCastMock {
    using SafeCast for uint;

    function castU128(uint a) public pure returns (uint128) {
        return a.castU128();
    }

    function castU64(uint a) public pure returns (uint64) {
        return a.castU64();
    }

    function castU32(uint a) public pure returns (uint32) {
        return a.castU32();
    }

    function castU16(uint a) public pure returns (uint16) {
        return a.castU16();
    }

    function castU8(uint a) public pure returns (uint8) {
        return a.castU8();
    }
}
