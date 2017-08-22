pragma solidity ^0.4.10;

/// @title Address multiplexer
/// @author Remco Bloemen <remco@neufund.org>
///
/// This contract can be used when a smart contract has a role that can be
/// fullfilled by only one address, but you would like multiple addresses to
/// fullfill the role.
///
/// For example, suppose we have a hot-wallet contract which has a role `bursar`
/// that is allowed to disburse money, like so:
///
/// ```
/// contract HotWallet is Owned {
///
///     address bursar;
///
///     modifier onlyBursar() {
///         require(msg.sender == bursar);
///         _;
///     }
///
///     function setBursar(addres newBursar)
///         public
///         onlyOwner()
///     {
///         bursar = newBursar;
///     }
///
///     function disburse(address beneficiary)
///         public
///         onlyBursar()
///     {
///         beneficiary.send(1 ether);
///     }
/// }
/// ```
///
/// But now our project is growing and our singly bursar can not handle all the
/// work anymore. We need to have multiple bursars. We would have to change the
/// contract and turn our `address bursar` into a `address[]` list, or a
/// `mapping(address => bool)`.
///
/// This is a problem. We can not re-deploy the contract, the code would
/// be much more complex, etc.
///
/// With the `Multiplexer` contract this is easy to solve. We simply deploy
///
/// ```
/// multiplexer = new Multiplexer(hotWallet, [bursar_1, bursar_2, …]);
/// hotWallet.setBursar(multiplexer);
/// multiHotWallet = HotWallet(multiplexer);
/// ```
///
/// Now all our bursars can use the `multiHotWallet` address as the new
/// `HotWallet` contract. All the functions will magically work and everything
/// will be forwarded to the real hot wallet contract:
///
/// ```
/// multiHotWallet.disburse(target);
/// ```
///
/// This does not have to be done as a retrofit. It is perfectly fine to
/// implement `HotWallet` as above, knowing that there will be multiple bursars
/// and then use a `Multiplexer` from the start. This has the advantage of
/// making the smart contract code much simpler and therefore less error prone.
///
/// @dev Any public or external function defined in this contract will no not be
///      forwarded. For that reason, we prefix all public interfaces with
///      `multiplex`. We also implement our own ownership  mechanism (as opposed
///      to inheriting from Ownable). This allows the Multiplexer to be used in
///      the owner role.
contract Multiplexer {

    ////////////////
    // State
    ////////////////

    /// @dev The current owner. We can not inherit from Ownable here because
    ///     the public functions may collide with public functions on the target
    ///     contract that we want to forward too.
    address private owner;

    /// @dev The candidate owner. For safety reasons, we do a
    //      transfer-accept handshake to prevent the ownership
    //      from being lost. See `owner`.
    address private ownerCandidate;

    /// @dev The target contract is the contract that we want to
    //      forward calls too. Only the owner can change the
    ///     target contract. In the example, the target
    ///     contract is the existing `HotWallet` instance.
    address private target;

    /// @dev Mapping for quick lookup if a particular address belongs to a
    ///     manager.
    mapping (address => bool) private isManager;

    /// @dev List for enumerating all current managers.
    address[] managersList;

    ////////////////
    // Events
    ////////////////

    /// @notice Event on change of ownership
    /// @param oldOwner The previous owner, who initiated the change
    /// @param newOwner The new owner, who can now call `onlyOwner`
    //                  functions
    event OwnerChanged(address oldOwner, address newOwner);

    /// @notice Event on change of target contract. The target contract
    ///     is the contract that we want to call. Only the owner can
    ///     change the target contract. In the example, the target
    ///     contract is the existing `HotWallet` instance.
    /// @param oldTarget The previous target contract.
    /// @param newTarget The new target contract.
    event TargetChanged(address oldTarget, address newTarget);

    /// @notice Event on addition of a manager. Managers are allowed
    ///     to call forwarded functions on this contract.
    /// @param manager The address of the new manager.
    event ManagerAdded(address manager);

    /// @notice Event on removal of a manager. Managers are allowed
    ///     to call forwarded functions on this contract.
    /// @param manager The address of the removed manager.
    event ManagerRemoved(address manager);

    ////////////////
    // Modifiers
    ////////////////

    /// @dev Only owner is allowed. We reimplement it here instead of
    ///     inheriting from Ownable so we can work arround the name
    ///     collision.
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /// @dev Only managers are allowed. Mangers are the people whitelisted
    ///     to access the target contract. In our example they are the bursars.
    modifier onlyManagers() {
        require(isManager[msg.sender] == true);
        _;
    }

    ////////////////
    // Constructor
    ////////////////

    /// @notice Constructor for the Multiplexer
    /// @param initialTarget The contract that we want to access. Don't forget
    ///     to set the role we want to access to the Multiplexer contract
    ///     address.
    /// @param initialManagers The initial set of addresses that are allowed to
    ///     access the target contract. In the example they are the bursars.
    function Multiplexer(
        address initialTarget,
        address[] initialManagers
    ) {
        target = initialTarget;
        for(uint i = 0; i < initialManagers.length; i++) {
            address manager = initialManagers[i];
            isManager[manager] = true;
            managersList.push(manager);
        }
    }

    ////////////////
    // Fallback function
    ////////////////

    /// @notice Fallback function. It forwards all calls from approved
    ///     managers to the target contract.
    function ()
        external
        payable
        onlyManagers()
    {
        bool success = target.call.value(msg.value)(msg.data);
        require(success);
    }

    ////////////////
    // External functions
    ////////////////

    /// @notice Renamed `transferOwnership` function. Can only be called by the
    ///     owner. It works as a regular transfer-accept ownership contract,
    ///     except it is prefixed with `multiplex`. The normal
    ///     `transferOwnership` call is forwarded to the target contract. This
    ///     allowed the Multiplex contract to be used in the owner role on the
    ///     target contract.
    /// @param newOwner Address of the new owner, the new owner will initially
    ///     just be a candidate owner. Only when she accepts, she will be owner.
    function multiplexTransferOwnership(address newOwner)
        external
        onlyOwner()
    {
        require(newOwner != owner);
        ownerCandidate = newOwner;
    }

    /// @notice Renamed `acceptOwnership` function. Can only be called by the
    ///     candidate owner. It works as a regular transfer-accept ownership
    ///     contract, except it is prefixed with `multiplex`. The normal
    ///     `acceptOwnership` call is forwarded to the target contract. This
    ///     allowed the Multiplex contract to be used in the owner role on the
    ///     target contract.
    function multiplexAcceptOwnership()
        external
    {
        require(msg.sender == ownerCandidate);
        address oldOwner = owner;
        owner = ownerCandidate;
        delete ownerCandidate;
        OwnerChanged(oldOwner, ownerCandidate);
    }

    /// @notice Renamed `destruct` function. Can only be called by the owner.
    ///     It works as a regular desctructable contract, except it is prefixed
    ///     with `multiplex`. The normal `desctruct` call is forwarded to the
    ///     target contract. This allowed the Multiplex contract to be used in
    ///     the owner role on the target contract.
    function multiplexDestruct()
        external
        onlyOwner()
    {
        selfdestruct(owner);
    }

    /// @notice Change the destination contract. Can only be called by the
    ///     owner. In the event that you'd like to re-use the multiplexer
    ///     contract on a different contract, you can simply retarget it.
    ///     There's is no need to deploy a new contract. In the example from the
    ///     introduction, if we would deploy a new HotWallet contract, we can
    ///     retarget the exising multiplexer. There is no need to deploy a new
    ///     one, add all the bursars again and tell all the bursars to change to
    ///     the new Multiplexer address.
    /// @param newTarget The new destination contract to forward calls to.
    function multiplexRetarget(address newTarget)
        external
        onlyOwner()
    {
        address oldTarget = target;
        target = newTarget;
        TargetChanged(oldTarget, newTarget);
    }

    /// @notice Add a manager. Managers can call forwarded functions.
    /// @param manager The address of the new manager. The address should not be
    ///     a manager already, or the function will revert.
    function multiplexAdd(address manager)
        external
        onlyOwner()
    {
        require(isManager[manager] == false);
        isManager[manager] = true;
        managersList.push(manager);

        ManagerAdded(manager);
    }

    /// @notice Remove a manager. Managers can call forwarded functions.
    /// @param manager The address of the manager to be removed. The address
    ///     must belong to a manger, or the function will revert.
    function multiplexRemove(address manager)
        external
        onlyOwner()
    {
        require(isManager[manager] == true);
        delete isManager[manager];
        for(uint i = 0; i < managersList.length; ++i) {
            if(managersList[i] == manager) {
                uint256 last = managersList.length - 1;
                managersList[i] = managersList[last];
                delete managersList[last];
                break;
            }
        }

        ManagerRemoved(manager);
    }

    /// @notice Renamend `owner` function.
    /// @return Returns the current owner.
    function multiplexOwner()
        external
        constant
        returns (address)
    {
        return owner;
    }

    /// @notice Check if someone is currently a managers.
    /// @return Returns true if the address belongs to a manager.
    function multiplexIsManager(address manager)
        external
        constant
        returns (bool)
    {
        return isManager[manager];
    }

    /// @notice Enumerate the managers.
    /// @return Returns a list of the current managers.
    function multiplexManagers()
        external
        constant
        returns (address[])
    {
        return managersList;
    }
}
