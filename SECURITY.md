# Security Policy

Security vulnerabilities should be disclosed to the project maintainers through [Immunefi], or alternatively by email to security@openzeppelin.com.

[Immunefi]: https://immunefi.com/bounty/openzeppelin

## Bug Bounty

Responsible disclosure of security vulnerabilities is rewarded through a bug bounty program on [Immunefi].

There is a bonus reward for issues introduced in release candidates that are reported before making it into a stable release. Learn more about release candidates at [`RELEASING.md`](./RELEASING.md).

## Security Patches

Security vulnerabilities will be patched as soon as responsibly possible, and published as an advisory on this repository (see [advisories]) and on the affected npm packages.

[advisories]: https://github.com/OpenZeppelin/openzeppelin-contracts/security/advisories

Projects that build on OpenZeppelin Contracts are encouraged to clearly state, in their source code and websites, how to be contacted about security issues in the event that a direct notification is considered necessary. We recommend including it in the NatSpec for the contract as `/// @custom:security-contact security@example.com`.

Additionally, we recommend installing the library through npm and setting up vulnerability alerts such as [Dependabot].

[Dependabot]: https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-supply-chain-security#what-is-dependabot

### Supported Versions

Security patches will be released for the latest minor of a given major release. For example, if an issue is found in versions >=4.6.0 and the latest is 4.8.0, the patch will be released only in version 4.8.1.

Only critical severity bug fixes will be backported to past major releases.

| Version | Critical security fixes | Other security fixes |
| ------- | ----------------------- | -------------------- |
| 5.x     | :white_check_mark:      | :white_check_mark:   |
| 4.9     | :white_check_mark:      | :x:                  |
| 3.4     | :white_check_mark:      | :x:                  |
| 2.5     | :x:                     | :x:                  |
| < 2.0   | :x:                     | :x:                  |

Note as well that the Solidity language itself only guarantees security updates for the latest release.

## Legal

Blockchain is a nascent technology and carries a high level of risk and uncertainty. OpenZeppelin makes certain software available under open source licenses, which disclaim all warranties in relation to the project and which limits the liability of OpenZeppelin. Subject to any particular licensing terms, your use of the project is governed by the terms found at [www.openzeppelin.com/tos](https://www.openzeppelin.com/tos) (the "Terms"). As set out in the Terms, you are solely responsible for any use of the project and you assume all risks associated with any such use. This Security Policy in no way evidences or represents an ongoing duty by any contributor, including OpenZeppelin, to correct any issues or vulnerabilities or alert you to all or any of the risks of utilizing the project.
