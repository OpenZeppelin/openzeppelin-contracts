// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./IERC1155.sol";
import "./IERC1155MetadataURI.sol";
import "./IERC1155Receiver.sol";
import "../../GSN/Context.sol";
import "../../introspection/ERC165.sol";
import "../../math/SafeMath.sol";
import "../../utils/Address.sol";

/**
 * @title Standard ERC1155 token
 *
 * @dev Implementation of the basic standard multi-token.
 * See https://eips.ethereum.org/EIPS/eip-1155
 * Originally based on code by Enjin: https://github.com/enjin/erc-1155
 */
contract ERC1155 is Context, ERC165, IERC1155, IERC1155MetadataURI {
    using SafeMath for uint256;
    using Address for address;

    // Mapping from token ID to account balances
    mapping (uint256 => mapping(address => uint256)) private _balances;

    // Mapping from account to operator approvals
    mapping (address => mapping(address => bool)) private _operatorApprovals;

    // Used as the URI for all token types by relying on ID substition, e.g. https://token-cdn-domain/{id}.json
    string private _uri;

    /*
     *     bytes4(keccak256('balanceOf(address,uint256)')) == 0x00fdd58e
     *     bytes4(keccak256('balanceOfBatch(address[],uint256[])')) == 0x4e1273f4
     *     bytes4(keccak256('setApprovalForAll(address,bool)')) == 0xa22cb465
     *     bytes4(keccak256('isApprovedForAll(address,address)')) == 0xe985e9c5
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256,uint256,bytes)')) == 0xf242432a
     *     bytes4(keccak256('safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)')) == 0x2eb2c2d6
     *
     *     => 0x00fdd58e ^ 0x4e1273f4 ^ 0xa22cb465 ^
     *        0xe985e9c5 ^ 0xf242432a ^ 0x2eb2c2d6 == 0xd9b67a26
     */
    bytes4 private constant _INTERFACE_ID_ERC1155 = 0xd9b67a26;

    /*
     *     bytes4(keccak256('uri(uint256)')) == 0x0e89341c
     */
    bytes4 private constant _INTERFACE_ID_ERC1155_METADATA_URI = 0x0e89341c;

    /**
     * @dev See {_setURI}.
     */
    constructor (string memory uri) public {
        _setURI(uri);

        // register the supported interfaces to conform to ERC1155 via ERC165
        _registerInterface(_INTERFACE_ID_ERC1155);

        // register the supported interfaces to conform to ERC1155MetadataURI via ERC165
        _registerInterface(_INTERFACE_ID_ERC1155_METADATA_URI);
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substituion mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * Clients calling this function must replace the `{id}` substring with the
     * actual token type ID.
     */
    function uri(uint256) external view override returns (string memory) {
        return _uri;
    }

    /**
        @dev Get the specified address' balance for token with specified ID.

        Attempting to query the zero account for a balance will result in a revert.

        @param account The address of the token holder
        @param id ID of the token
        @return The account's balance of the token type requested
     */
    function balanceOf(address account, uint256 id) public view override returns (uint256) {
        require(account != address(0), "ERC1155: balance query for the zero address");
        return _balances[id][account];
    }

    /**
        @dev Get the balance of multiple account/token pairs.

        If any of the query accounts is the zero account, this query will revert.

        @param accounts The addresses of the token holders
        @param ids IDs of the tokens
        @return Balances for each account and token id pair
     */
    function balanceOfBatch(
        address[] memory accounts,
        uint256[] memory ids
    )
        public
        view
        override
        returns (uint256[] memory)
    {
        require(accounts.length == ids.length, "ERC1155: accounts and IDs must have same lengths");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            require(accounts[i] != address(0), "ERC1155: some address in batch balance query is zero");
            batchBalances[i] = _balances[ids[i]][accounts[i]];
        }

        return batchBalances;
    }

    /**
     * @dev Sets or unsets the approval of a given operator.
     *
     * An operator is allowed to transfer all tokens of the sender on their behalf.
     *
     * Because an account already has operator privileges for itself, this function will revert
     * if the account attempts to set the approval status for itself.
     *
     * @param operator address to set the approval
     * @param approved representing the status of the approval to be set
     */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(_msgSender() != operator, "ERC1155: cannot set approval status for self");
        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }

    /**
        @notice Queries the approval status of an operator for a given account.
        @param account   The account of the Tokens
        @param operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(address account, address operator) public view override returns (bool) {
        return _operatorApprovals[account][operator];
    }

    /**
        @dev Transfers `value` amount of an `id` from the `from` address to the `to` address specified.
        Caller must be approved to manage the tokens being transferred out of the `from` account.
        If `to` is a smart contract, will call `onERC1155Received` on `to` and act appropriately.
        @param from Source address
        @param to Target address
        @param id ID of the token type
        @param value Transfer amount
        @param data Data forwarded to `onERC1155Received` if `to` is a contract receiver
    */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    )
        public
        virtual
        override
    {
        require(to != address(0), "ERC1155: target address must be non-zero");
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: need operator approval for 3rd party transfers"
        );

        address operator = _msgSender();

        _beforeTokenTransfer(operator, from, to, asSingletonArray(id), asSingletonArray(value), data);

        _balances[id][from] = _balances[id][from].sub(value, "ERC1155: insufficient balance for transfer");
        _balances[id][to] = _balances[id][to].add(value);

        emit TransferSingle(operator, from, to, id, value);

        _doSafeTransferAcceptanceCheck(operator, from, to, id, value, data);
    }

    /**
        @dev Transfers `values` amount(s) of `ids` from the `from` address to the
        `to` address specified. Caller must be approved to manage the tokens being
        transferred out of the `from` account. If `to` is a smart contract, will
        call `onERC1155BatchReceived` on `to` and act appropriately.
        @param from Source address
        @param to Target address
        @param ids IDs of each token type
        @param values Transfer amounts per token type
        @param data Data forwarded to `onERC1155Received` if `to` is a contract receiver
    */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    )
        public
        virtual
        override
    {
        require(ids.length == values.length, "ERC1155: IDs and values must have same lengths");
        require(to != address(0), "ERC1155: target address must be non-zero");
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: need operator approval for 3rd party transfers"
        );

        address operator = _msgSender();

        _beforeTokenTransfer(operator, from, to, ids, values, data);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 value = values[i];

            _balances[id][from] = _balances[id][from].sub(
                value,
                "ERC1155: insufficient balance of some token type for transfer"
            );
            _balances[id][to] = _balances[id][to].add(value);
        }

        emit TransferBatch(operator, from, to, ids, values);

        _doSafeBatchTransferAcceptanceCheck(operator, from, to, ids, values, data);
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substituion mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * By this mechanism, any occurence of the `{id}` substring in either the
     * URI or any of the values in the JSON file at said URI will be replaced by
     * clients with the token type ID.
     *
     * For example, the `https://token-cdn-domain/{id}.json` URI would be
     * interpreted by clients as
     * `https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json`
     * for token type ID 0x4cce0.
     *
     * See {uri}.
     *
     * Because these URIs cannot be meaningfully represented by the {URI} event,
     * this function emits no events.
     */
    function _setURI(string memory newuri) internal virtual {
        _uri = newuri;
    }

    /**
     * @dev Internal function to mint an amount of a token with the given ID
     * @param to The address that will own the minted token
     * @param id ID of the token to be minted
     * @param value Amount of the token to be minted
     * @param data Data forwarded to `onERC1155Received` if `to` is a contract receiver
     */
    function _mint(address to, uint256 id, uint256 value, bytes memory data) internal virtual {
        require(to != address(0), "ERC1155: mint to the zero address");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, address(0), to, asSingletonArray(id), asSingletonArray(value), data);

        _balances[id][to] = _balances[id][to].add(value);
        emit TransferSingle(operator, address(0), to, id, value);

        _doSafeTransferAcceptanceCheck(operator, address(0), to, id, value, data);
    }

    /**
     * @dev Internal function to batch mint amounts of tokens with the given IDs
     * @param to The address that will own the minted token
     * @param ids IDs of the tokens to be minted
     * @param values Amounts of the tokens to be minted
     * @param data Data forwarded to `onERC1155Received` if `to` is a contract receiver
     */
    function _mintBatch(address to, uint256[] memory ids, uint256[] memory values, bytes memory data) internal virtual {
        require(to != address(0), "ERC1155: batch mint to the zero address");
        require(ids.length == values.length, "ERC1155: minted IDs and values must have same lengths");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, address(0), to, ids, values, data);

        for (uint i = 0; i < ids.length; i++) {
            _balances[ids[i]][to] = values[i].add(_balances[ids[i]][to]);
        }

        emit TransferBatch(operator, address(0), to, ids, values);

        _doSafeBatchTransferAcceptanceCheck(operator, address(0), to, ids, values, data);
    }

    /**
     * @dev Internal function to burn an amount of a token with the given ID
     * @param account Account which owns the token to be burnt
     * @param id ID of the token to be burnt
     * @param value Amount of the token to be burnt
     */
    function _burn(address account, uint256 id, uint256 value) internal virtual {
        require(account != address(0), "ERC1155: attempting to burn tokens on zero account");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, account, address(0), asSingletonArray(id), asSingletonArray(value), "");

        _balances[id][account] = _balances[id][account].sub(
            value,
            "ERC1155: attempting to burn more than balance"
        );

        emit TransferSingle(operator, account, address(0), id, value);
    }

    /**
     * @dev Internal function to batch burn an amounts of tokens with the given IDs
     * @param account Account which owns the token to be burnt
     * @param ids IDs of the tokens to be burnt
     * @param values Amounts of the tokens to be burnt
     */
    function _burnBatch(address account, uint256[] memory ids, uint256[] memory values) internal virtual {
        require(account != address(0), "ERC1155: attempting to burn batch of tokens on zero account");
        require(ids.length == values.length, "ERC1155: burnt IDs and values must have same lengths");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, account, address(0), ids, values, "");

        for (uint i = 0; i < ids.length; i++) {
            _balances[ids[i]][account] = _balances[ids[i]][account].sub(
                values[i],
                "ERC1155: attempting to burn more than balance for some token"
            );
        }

        emit TransferBatch(operator, account, address(0), ids, values);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning, as well as batched variants.
     *
     * The same hook is called on both single and batched variants. For single
     * transfers, the length of the `id` and `amount` arrays will be 1.
     *
     * Calling conditions (for each `id` and `amount` pair):
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * of token type `id` will be  transferred to `to`.
     * - when `from` is zero, `amount` tokens of token type `id` will be minted
     * for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens of token type `id`
     * will be burned.
     * - `from` and `to` are never both zero.
     * - `ids` and `amounts` have the same, non-zero length.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal virtual
    { }

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    )
        private
    {
        if (to.isContract()) {
            require(
                IERC1155Receiver(to).onERC1155Received(operator, from, id, value, data) ==
                    IERC1155Receiver(to).onERC1155Received.selector,
                "ERC1155: got unknown value from onERC1155Received"
            );
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    )
        private
    {
        if (to.isContract()) {
            require(
                IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, values, data) ==
                    IERC1155Receiver(to).onERC1155BatchReceived.selector,
                "ERC1155: got unknown value from onERC1155BatchReceived"
            );
        }
    }

    function asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }
}
