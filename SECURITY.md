# Security Policy

Security vulnerabilities should be disclosed to the project maintainers through [Immunefi], or alternatively by email to security@openzeppelin.com.

[Immunefi]: https://immunefi.com/bounty/openzeppelin

## Bug Bounty

Responsible disclosure of security vulnerabilities is rewarded through a bug bounty program on [Immunefi].

There is a bonus reward for issues introduced in release candidates that are reported before making it into a stable release.

## Security Patches

Security vulnerabilities will be patched as soon as responsibly possible, and published as an advisory on this repository (see [advisories]) and on the affected npm packages.

[advisories]: https://github.com/OpenZeppelin/openzeppelin-contracts/security/advisories

Projects that build on OpenZeppelin Contracts are encouraged to clearly state, in their source code and websites, how to be contacted about security issues in the event that a direct notification is considered necessary. Additionally, we recommend installing the library through npm and setting up vulnerability alerts such as [Dependabot].

[Dependabot]: https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-supply-chain-security#what-is-dependabot

### Supported Versions

Only critical severity bug fixes will be backported to past major releases.

| Version | Supported                             |
| ------- | ------------------------------------- |
| 4.x     | :white_check_mark: :white_check_mark: |
| 3.4     | :white_check_mark:                    |
| 2.5     | :white_check_mark:                    |
| < 2.0   | :x:                                   |

Note as well that the Solidity language itself only guarantees security updates for the latest release.
