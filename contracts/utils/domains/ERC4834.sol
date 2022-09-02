// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (utils/domains/ERC4834.sol)

pragma solidity ^0.8.0;

import "./IERC4834.sol";
import "./IERC4834AccessControl.sol";
import "./IERC4834Enumerable.sol";
import "../../utils/introspection/ERC165.sol";
import "../../utils/introspection/ERC165Checker.sol";
import "../Context.sol";

abstract contract ERC4834 is IERC4834. IERC4834AccessControl, IDomainEnumerable, ERC165, ERC165Checker, Context {
    mapping(string memory => address) private domains;
    mapping(string memory => uint) private domainIndices;
    mapping(uint => string memory) private domainByIndex;
    uint256 private numDomains;

    /**
     * @notice     Query if a domain has a subdomain with a given name
     * @param      name The subdomain to query
     * @return     `true` if the domain has a subdomain with the given name, `false` otherwise
     */
    function hasDomain(string memory name) public view virtual returns (bool) {
        return domains[name] != address(0);
    }

    /**
     * @notice     Fetch the subdomain with a given name
     * @dev        This should revert if `hasDomain(name)` is `false`
     * @param      name The subdomain to fetch
     * @return     The subdomain with the given name
     */
    function getDomain(string memory name) public view virtual returns (address) {
        require(hasDomain(name));
        return domains[name];
    }
    
    /**
     * @notice     Create a subdomain with a given name
     * @dev        This should revert if `canCreateDomain(msg.sender, name, pointer)` is `false` or if the domain exists
     * @param      name The subdomain name to be created
     * @param      subdomain The subdomain to create
     */
    function createDomain(string memory name, address subdomain) public virtual {
        require(canCreateDomain(_msgSender(), name, subdomain), "Sender not authorized to create domain");
        _setDomain(name, subdomain);
    }

    /**
     * @notice     Update a subdomain with a given name
     * @dev        This should revert if `canSetDomain(msg.sender, name, pointer)` is `false` of if the domain doesn't exist
     * @param      name The subdomain name to be updated
     * @param      subdomain The subdomain to set
     */
    function setDomain(string memory name, address subdomain) public virtual {
        require(canSetDomain(_msgSender(), name, subdomain), "Sender not authorized to set domain");
        _setDomain(name, subdomain);
    }

    /**
     * @notice     Delete the subdomain with a given name
     * @dev        This should revert if the domain doesn't exist or if
     *             `canDeleteDomain(msg.sender, name)` is `false`
     * @param      name The subdomain to delete
     */
    function deleteDomain(string memory name) public virtual {
        require(canDeleteDomain(_msgSender(), name), "Sender not authorized to delete domain");
        _deleteDomain(name);
    }
    
    /**
     * @notice Create a domain with the given name. No authentication is performed.
     * @dev    Use _beforeCreateDomain to perform additional checks and _afterCreateDomain to perform additional actions.
     */
    function _createDomain(string memory name, address subdomain) internal {
        require(subdomain != address(0), "Subdomain should not be the zero address");
        require(hasDomain(name),  "Domain must exist");

        _beforeCreateDomain(name, subdomain);

        domains[name] = subdomain;
        domainIndices[name] = numDomains;
        domainByIndex[numDomains] = name;
        numDomains++;
        emit SubdomainCreate(_msgSender(), name, subdomain);

        _afterCreateDomain(name, subdomain);
    }

    function _setDomain(string memory name, address subdomain) internal {
        require(subdomain != address(0), "Subdomain should not be the zero address");
        require(hasDomain(name),  "Domain must exist");

        address previousValue = getDomain(name);
        _beforeSetDomain(name, subdomain, previousValue);

        domains[name] = subdomain;
        emit SubdomainUpdate(_msgSender(), name, subdomain, previousValue);

        _afterSetDomain(name, subdomain, previousValue);
    }

    function _deleteDomain(string memory name) internal {
        require(hasDomain(name),  "Domain must exist");

        address previousValue = getDomain(name);
        _beforeDeleteDomain(name, previousValue);

        numDomains--;
        domains[name] = address(0);
        
        domainIndices[domainByIndex[numDomains]] = domainIndices[name];
        domainByIndex[domainIndices[name]] = domainByIndex[numDomains];

        domainByIndex[numDomains] = "";
        domainIndices[name] = 0;

        emit SubdomainDelete(_msgSender(), name, previousValue);

        _afterDeleteDomain(name, previousValue);
    }

    function _beforeCreateDomain(string memory name, address subdomain) internal virtual {
        
    }

    function _beforeSetDomain(string memory name, address subdomain, address previousValue) internal virtual {

    }

    function _beforeDeleteDomain(string memory name, address previousValue) internal virtual {

    }

    function _afterCreateDomain(string memory name, address subdomain) internal virtual {
        
    }
    
    function _afterSetDomain(string memory name, address subdomain, address previousValue) internal virtual {

    }

    function _afterDeleteDomain(string memory name, address previousValue) internal virtual {

    }

    /**
     * @notice     Get if an account can create a subdomain with a given name
     * @dev        This must return `false` if `hasDomain(name)` is `true`.
     * @param      updater The account that may or may not be able to create/update a subdomain
     * @param      name The subdomain name that would be created/updated
     * @param      subdomain The subdomain that would be set
     * @return     Whether an account can update or create the subdomain
     */
    function canCreateDomain(address updater, string memory name, address subdomain) public view virtual returns (bool) {
        return !hasDomain(name);
    }

    /**
     * @notice     Get if an account can update or create a subdomain with a given name
     * @dev        This must return `false` if `hasDomain(name)` is `false`.
     *             If `getDomain(name)` is also a domain, this should return `false` if
     *             `getDomain(name).canMoveSubdomain(msg.sender, this, subdomain)` is `false`.
     * @param      updater The account that may or may not be able to create/update a subdomain
     * @param      name The subdomain name that would be created/updated
     * @param      subdomain The subdomain that would be set
     * @return     Whether an account can update or create the subdomain
     */
    function canSetDomain(address updater, string memory name, address subdomain) public view virtual returns (bool) {
        // Existence Check
        if (!hasDomain(name)) {
            return false;
        }

        // Auth Check
        return supportsInterface(getDomain(name), type(IDomainAccessControl).interfaceId) && IDomainAccessControl(getDomain(name)).canMoveSubdomain(updater, name, this, subdomain);
    }

    /**
     * @notice     Get if an account can delete the subdomain with a given name
     * @dev        This must return `false` if `hasDomain(name)` is `false`.
     *             If `getDomain(name)` is a domain, this should return `false` if
     *             `getDomain(name).canDeleteSubdomain(msg.sender, this, subdomain)` is `false`.
     * @param      updater The account that may or may not be able to delete a subdomain
     * @param      name The subdomain to delete
     * @return     Whether an account can delete the subdomain
     */
    function canDeleteDomain(address updater, string memory name) public view virtual returns (bool) {
        // Existence Check
        if (!hasDomain(name)) {
            return false;
        }

        // Auth Check
        return supportsInterface(getDomain(name), type(IDomainAccessControl).interfaceId) && IDomainAccessControl(getDomain(name)).canDeleteSubdomain(updater, name, this);
    }

    /**
     * @notice     Query all subdomains. Must revert if the number of domains is unknown or infinite.
     * @return     The subdomain with the given index.
     */
    function subdomainByIndex(uint256 index) external view returns (string memory) {
        string memory empty = "";
        require(keccak256(bytes(domainByIndex[index])) != keccak256(bytes(empty)));
        return domainByIndex[index];
    }
    
    /**
     * @notice     Get the total number of subdomains. Must revert if the number of domains is unknown or infinite.
     * @return     The total number of subdomains
     */
    function totalSubdomains() external view returns (uint256) {
        return numDomains;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        return interfaceId == type(IERC4834).interfaceId || interfaceId == type(IERC4834AccessControl).interfaceId || interfaceId == type(IERC4834Enumerable).interfaceId || super.supportsInterface(interfaceId);
    }
}
