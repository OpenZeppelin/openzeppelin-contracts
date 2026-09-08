import { addressCoder } from 'interoperable-addresses';

/**
 * Deploys an ERC-7786 mock gateway on each of the given chains (network connections, which MUST have distinct chain
 * ids), and relays messages between them, so that a message sent on one chain gets delivered on the others.
 *
 * The gateway deployed on a chain is available through {gateway}.
 *
 *   const chainA = await network.create({ override: { chainId: 17 } });
 *   const chainB = await network.create({ override: { chainId: 42 } });
 *   const bridge = await ERC7786Bridge.create(chainA, chainB);
 *
 * Note that, being a mock, the bridge pays the message `value` out of its own funds on the destination chain.
 */
export class ERC7786Bridge {
  constructor(...chains) {
    // chain ids must be distinct, otherwise messages cannot be routed
    const ids = chains.map(chain => BigInt(chain.helpers.chain.reference));
    if (new Set(ids).size !== ids.length) throw new Error('Bridged chains must have distinct chain ids');

    // chainId (bigint) → { chain, gateway }
    this.chainsAsPromise = Promise.all(
      chains.map(chain =>
        chain.ethers
          .deployContract('$ERC7786GatewayMock')
          .then(gateway => [BigInt(chain.helpers.chain.reference), { chain, gateway }]),
      ),
    ).then(entries => new Map(entries));
    // chain → next block to scan
    this.cursors = new Map();
    // state of {loadFixture}
    this.fixture = null;
    this.snapshots = null;
    this.result = null;
  }

  /// Build a bridge over the given chains, and wait for its gateways to be deployed.
  static create(...chains) {
    return new ERC7786Bridge(...chains).wait();
  }

  async wait() {
    this.chains = await this.chainsAsPromise;
    await this.reset();
    return this;
  }

  /// The ERC-7786 gateway deployed on a given chain (connection or chain id).
  gateway(chain) {
    return this.chains.get(BigInt(chain?.helpers?.chain?.reference ?? chain))?.gateway;
  }

  /// Drop any message that is currently pending, and resynchronize with the current state of the chains.
  async reset() {
    for (const { chain } of this.chains.values()) {
      await chain.ethers.provider.getBlockNumber().then(block => this.cursors.set(chain, block + 1));
    }
    return this;
  }

  /// Messages sent (to a remote chain) on the given chain since the last scan.
  async scan({ chain, gateway }) {
    const from = this.cursors.get(chain);
    const to = await chain.ethers.provider.getBlockNumber();
    this.cursors.set(chain, to + 1);

    // Block number went backward: the chain was reverted (snapshot), skip whatever is left in the history.
    return to < from
      ? []
      : await gateway
          .queryFilter(gateway.filters.MessageSent(), from, to)
          .then(events => events.map(({ args }) => args));
  }

  /**
   * Deliver the messages sent since the previous call, cascading until no new message is produced, and return the
   * corresponding relaying transactions (in delivery order).
   *
   *   await sender.sendCrosschainMessage(...); // on chain A
   *   const [tx] = await bridge.relay();
   *   await expect(tx).to.emit(recipient, 'MessageReceived'); // on chain B
   */
  async relay() {
    const txs = [];
    for (let progress = true; progress; ) {
      progress = false;
      for (const source of this.chains.values()) {
        for (const { sender, recipient, payload, value } of await this.scan(source)) {
          const destination = this.gateway(addressCoder.decode(recipient).reference);
          if (!destination) throw new Error(`Cannot relay message to unknown chain: ${recipient}`);
          txs.push(await destination.relayMessage(sender, recipient, payload, { value }));
          progress = true;
        }
      }
    }
    return txs;
  }

  /**
   * Multichain equivalent of `networkHelpers.loadFixture`. Runs the fixture once, then restores every chain (and this
   * bridge's state) before each subsequent call. Only one fixture can be used per bridge.
   *
   * Note that `networkHelpers.loadFixture` cannot be used in a multichain test: it only snapshots the connection it
   * belongs to, leaving the other chains to accumulate state across tests.
   */
  async loadFixture(fn) {
    if (this.snapshots) {
      if (fn !== this.fixture) throw new Error('Only one fixture can be used per bridge');
      await Promise.all(this.snapshots.map(snapshot => snapshot.restore()));
    } else {
      this.fixture = fn;
      this.result = await fn();
      this.snapshots = await Promise.all(
        Array.from(this.chains.values(), ({ chain }) => chain.networkHelpers.takeSnapshot()),
      );
    }
    await this.reset();
    return this.result;
  }
}
