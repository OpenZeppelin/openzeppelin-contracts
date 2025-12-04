# Running formal verification tool

These instructions detail the process for running Formal Verification Tool on OpenZeppelin Contracts.

Documentation for CVT and the specification language is available [here](https://certora.atlassian.net/wiki/spaces/CPD/overview).

## Prerequisites

Follow the [Certora installation guide](https://docs.certora.com/en/latest/docs/user-guide/getting-started/install.html) in order to get the Certora Prover Package and the `solc` executable folder in your path.

> **Note**
> An API Key is required for local testing. Although the prover will run on a GitHub Actions' CI environment on selected Pull Requests.

## Running the verification

The Formal Verification Tool proves specs for contracts, which are defined by per-spec `.conf` files located under `fv/specs/` along with their pre-configured options.

The verification script `./run.js` is used to submit verification jobs to the Certora Verification service.

You can run it from the root of the repository with the following command:

```bash
node fv/run.js [SPEC_NAME | fv/specs/NAME.conf] [--all] [-p N] [-v]
```

Where:

- `SPEC_NAME` is the base name of a configuration file in `fv/specs/` without extension. For example, `AccessControl` maps to `fv/specs/AccessControl.conf`.
- Alternatively, you may pass an explicit path to a `.conf` file under `fv/specs/`.
- Supported script options are `--all`, `--parallel/-p`, and `--verbose/-v`.

> **Note**
> A single spec may be configured to run for multiple contracts, whereas a single contract may run multiple specs.

Example usage:

```bash
node fv/run.js AccessControl # Run the AccessControl configuration (fv/specs/AccessControl.conf) using its harness and spec
```

## Adapting to changes in the contracts

Some of our rules require the code to be simplified in various ways. Our primary tool for performing these simplifications is to run verification on a contract that extends the original contracts and overrides some of the methods. These "harness" contracts can be found in the `fv/harnesses` directory.

This pattern does require some modifications to the original code: some methods need to be made virtual or public, for example. These changes are handled by applying a patch
to the code before verification by running:

```bash
make -C fv apply
```

Before running the `fv/run.js` script, it's required to apply the corresponding patches to the `contracts` directory, placing the output in the `fv/patched` directory. Then, the contracts are verified by running the verification for the `fv/patched` directory.

If the original contracts change, it is possible to create a conflict with the patch. In this case, the verify scripts will report an error message and output rejected changes in the `patched` directory. After merging the changes, run `make record` in the `fv` directory; this will regenerate the patch file, which can then be checked into git.

For more information about the `make` scripts available, run:

```bash
make -C fv help
```
