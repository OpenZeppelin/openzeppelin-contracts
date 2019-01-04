pragma solidity ^0.5.0;

import "../drafts/SignatureBouncer.sol";
import "./SignerRoleMock.sol";

contract SignatureBouncerMock is SignatureBouncer, SignerRoleMock {
    function checkValidSignature(address account, bytes memory signature)
        public view returns (bool)
    {
        return _isValidSignature(account, signature);
    }

    function onlyWithValidSignature(bytes memory signature)
        public onlyValidSignature(signature) view
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function checkValidSignatureAndMethod(address account, bytes memory signature)
        public view returns (bool)
    {
        return _isValidSignatureAndMethod(account, signature);
    }

    function onlyWithValidSignatureAndMethod(bytes memory signature)
        public onlyValidSignatureAndMethod(signature) view
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function checkValidSignatureAndData(address account, bytes memory, uint, bytes memory signature)
        public view returns (bool)
    {
        return _isValidSignatureAndData(account, signature);
    }

    function onlyWithValidSignatureAndData(uint, bytes memory signature)
        public onlyValidSignatureAndData(signature) view
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function theWrongMethod(bytes memory) public pure {
        // solhint-disable-previous-line no-empty-blocks
    }

    function tooShortMsgData() public onlyValidSignatureAndData("") view {
        // solhint-disable-previous-line no-empty-blocks
    }
}
