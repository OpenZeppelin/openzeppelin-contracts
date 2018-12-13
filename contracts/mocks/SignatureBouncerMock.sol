pragma solidity ^0.4.24;

import "../drafts/SignatureBouncer.sol";
import "./SignerRoleMock.sol";

contract SignatureBouncerMock is SignatureBouncer, SignerRoleMock {
    function checkValidSignature(address account, bytes signature) public view returns (bool) {
        return _isValidSignature(account, signature);
    }

    function onlyWithValidSignature(bytes signature) public onlyValidSignature(signature) view {}

    function checkValidSignatureAndMethod(address account, bytes signature) public view returns (bool) {
        return _isValidSignatureAndMethod(account, signature);
    }

    function onlyWithValidSignatureAndMethod(bytes signature) public onlyValidSignatureAndMethod(signature) view {}

    function checkValidSignatureAndData(address account, bytes, uint, bytes signature) public view returns (bool) {
        return _isValidSignatureAndData(account, signature);
    }

    function onlyWithValidSignatureAndData(uint, bytes signature) public onlyValidSignatureAndData(signature) view {}

    function theWrongMethod(bytes) public pure {}

    function tooShortMsgData() public onlyValidSignatureAndData("") view {}
}
