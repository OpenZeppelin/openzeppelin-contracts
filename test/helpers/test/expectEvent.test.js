const expectEvent = require('../expectEvent');
const shouldFail = require('../shouldFail');

const EventEmitter = artifacts.require('EventEmitter');
const IndirectEventEmitter = artifacts.require('IndirectEventEmitter');

const { should, BigNumber } = require('../../helpers/setup');

describe('expectEvent', function () {
  beforeEach(async function () {
    this.constructionValues = {
      uint: 42,
      boolean: true,
      string: 'OpenZeppelin',
    };

    this.emitter = await EventEmitter.new(
      this.constructionValues.uint,
      this.constructionValues.boolean,
      this.constructionValues.string
    );
  });

  describe('inConstructor', function () {
    context('short uint value', function () {
      it('accepts emitted events with correct number', async function () {
        await expectEvent.inConstruction(this.emitter, 'ShortUint',
          { value: this.constructionValues.uint }
        );
      });

      it('throws if an incorrect value is passed', async function () {
        await shouldFail(expectEvent.inConstruction(this.emitter, 'ShortUint', { value: 23 }));
      });
    });

    context('boolean value', function () {
      it('accepts emitted events with correct value', async function () {
        await expectEvent.inConstruction(this.emitter, 'Boolean', { value: this.constructionValues.boolean });
      });

      it('throws if an incorrect value is passed', async function () {
        await shouldFail(expectEvent.inConstruction(this.emitter, 'Boolean',
          { value: !this.constructionValues.boolean }
        ));
      });
    });

    context('string value', function () {
      it('accepts emitted events with correct string', async function () {
        await expectEvent.inConstruction(this.emitter, 'String', { value: this.constructionValues.string });
      });

      it('throws if an incorrect string is passed', async function () {
        await shouldFail(expectEvent.inConstruction(this.emitter, 'String', { value: 'ClosedZeppelin' }));
      });
    });

    it('throws if an unemitted event is requested', async function () {
      await shouldFail(expectEvent.inConstruction(this.emitter, 'UnemittedEvent'));
    });
  });

  describe('inLogs', function () {
    describe('with no arguments', function () {
      beforeEach(async function () {
        ({ logs: this.logs } = await this.emitter.emitArgumentless());
      });

      it('accepts emitted events', function () {
        expectEvent.inLogs(this.logs, 'Argumentless');
      });

      it('throws if an unemitted event is requested', function () {
        should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent'));
      });
    });

    describe('with single argument', function () {
      context('short uint value', function () {
        beforeEach(async function () {
          this.value = 42;
          ({ logs: this.logs } = await this.emitter.emitShortUint(this.value));
        });

        it('accepts emitted events with correct JavaScript number', function () {
          expectEvent.inLogs(this.logs, 'ShortUint', { value: this.value });
        });

        it('accepts emitted events with correct BigNumber', function () {
          expectEvent.inLogs(this.logs, 'ShortUint', { value: new BigNumber(this.value) });
        });

        it('throws if an unemitted event is requested', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.value }));
        });

        it('throws if an incorrect value is passed', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'ShortUint', { value: 23 }));
        });
      });

      context('short int value', function () {
        beforeEach(async function () {
          this.value = -42;
          ({ logs: this.logs } = await this.emitter.emitShortInt(this.value));
        });

        it('accepts emitted events with correct JavaScript number', function () {
          expectEvent.inLogs(this.logs, 'ShortInt', { value: this.value });
        });

        it('accepts emitted events with correct BigNumber', function () {
          expectEvent.inLogs(this.logs, 'ShortInt', { value: new BigNumber(this.value) });
        });

        it('throws if an unemitted event is requested', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.value }));
        });

        it('throws if an incorrect value is passed', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'ShortInt', { value: -23 }));
        });
      });

      context('long uint value', function () {
        beforeEach(async function () {
          this.bigNumValue = new BigNumber('123456789012345678901234567890');
          ({ logs: this.logs } = await this.emitter.emitLongUint(this.bigNumValue));
        });

        it('accepts emitted events with correct BigNumber', function () {
          expectEvent.inLogs(this.logs, 'LongUint', { value: this.bigNumValue });
        });

        it('throws if an unemitted event is requested', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.bigNumValue }));
        });

        it('throws if an incorrect value is passed', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'LongUint', { value: 2300 }));
        });
      });

      context('long int value', function () {
        beforeEach(async function () {
          this.bigNumValue = new BigNumber('-123456789012345678901234567890');
          ({ logs: this.logs } = await this.emitter.emitLongInt(this.bigNumValue));
        });

        it('accepts emitted events with correct BigNumber', function () {
          expectEvent.inLogs(this.logs, 'LongInt', { value: this.bigNumValue });
        });

        it('throws if an unemitted event is requested', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.bigNumValue }));
        });

        it('throws if an incorrect value is passed', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'LongInt', { value: -2300 }));
        });
      });

      context('address value', function () {
        beforeEach(async function () {
          this.value = '0x811412068e9fbf25dc300a29e5e316f7122b282c';
          ({ logs: this.logs } = await this.emitter.emitAddress(this.value));
        });

        it('accepts emitted events with correct address', function () {
          expectEvent.inLogs(this.logs, 'Address', { value: this.value });
        });

        it('throws if an unemitted event is requested', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.value }));
        });

        it('throws if an incorrect value is passed', function () {
          should.Throw(() =>
            expectEvent.inLogs(this.logs, 'Address', { value: '0x21d04e022e0b52b5d5bcf90b7f1aabf406be002d' })
          );
        });
      });

      context('boolean value', function () {
        beforeEach(async function () {
          this.value = true;
          ({ logs: this.logs } = await this.emitter.emitBoolean(this.value));
        });

        it('accepts emitted events with correct address', function () {
          expectEvent.inLogs(this.logs, 'Boolean', { value: this.value });
        });

        it('throws if an unemitted event is requested', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.value }));
        });

        it('throws if an incorrect value is passed', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'Boolean', { value: false }));
        });
      });

      context('string value', function () {
        beforeEach(async function () {
          this.value = 'OpenZeppelin';
          ({ logs: this.logs } = await this.emitter.emitString(this.value));
        });

        it('accepts emitted events with correct string', function () {
          expectEvent.inLogs(this.logs, 'String', { value: this.value });
        });

        it('throws if an unemitted event is requested', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.value }));
        });

        it('throws if an incorrect value is passed', function () {
          should.Throw(() => expectEvent.inLogs(this.logs, 'String', { value: 'ClosedZeppelin' }));
        });
      });
    });

    describe('with multiple arguments', function () {
      beforeEach(async function () {
        this.uintValue = new BigNumber('123456789012345678901234567890');
        this.booleanValue = true;
        this.stringValue = 'OpenZeppelin';
        ({ logs: this.logs } =
          await this.emitter.emitLongUintBooleanString(this.uintValue, this.booleanValue, this.stringValue));
      });

      it('accepts correct values', function () {
        expectEvent.inLogs(this.logs, 'LongUintBooleanString', {
          uintValue: this.uintValue, booleanValue: this.booleanValue, stringValue: this.stringValue,
        });
      });

      it('throws with correct values assigned to wrong arguments', function () {
        should.Throw(() => expectEvent.inLogs(this.logs, 'LongUintBooleanString', {
          uintValue: this.booleanValue, booleanValue: this.uintValue, stringValue: this.stringValue,
        }));
      });

      it('throws when any of the values is incorrect', function () {
        should.Throw(() => expectEvent.inLogs(this.logs, 'LongUintBooleanString', {
          uintValue: 23, booleanValue: this.booleanValue, stringValue: this.stringValue,
        }));

        should.Throw(() => expectEvent.inLogs(this.logs, 'LongUintBooleanString', {
          uintValue: this.uintValue, booleanValue: false, stringValue: this.stringValue,
        }));

        should.Throw(() => expectEvent.inLogs(this.logs, 'LongUintBooleanString', {
          uintValue: this.uintValue, booleanValue: this.booleanValue, stringValue: 'ClosedZeppelin',
        }));
      });
    });

    describe('with multiple events', function () {
      beforeEach(async function () {
        this.uintValue = 42;
        this.booleanValue = true;
        ({ logs: this.logs } = await this.emitter.emitLongUintAndBoolean(this.uintValue, this.booleanValue));
      });

      it('accepts all emitted events with correct values', function () {
        expectEvent.inLogs(this.logs, 'LongUint', { value: this.uintValue });
        expectEvent.inLogs(this.logs, 'Boolean', { value: this.booleanValue });
      });

      it('throws if an unemitted event is requested', function () {
        should.Throw(() => expectEvent.inLogs(this.logs, 'UnemittedEvent', { value: this.uintValue }));
      });

      it('throws if incorrect values are passed', function () {
        should.Throw(() => expectEvent.inLogs(this.logs, 'LongUint', { value: 23 }));
        should.Throw(() => expectEvent.inLogs(this.logs, 'Boolean', { value: false }));
      });
    });

    describe('with events emitted by an indirectly called contract', function () {
      beforeEach(async function () {
        this.secondEmitter = await IndirectEventEmitter.new();

        this.value = 'OpenZeppelin';
        ({ logs: this.logs } = await this.emitter.emitStringAndEmitIndirectly(this.value, this.secondEmitter.address));
      });

      it('accepts events emitted by the directly called contract', function () {
        expectEvent.inLogs(this.logs, 'String', { value: this.value });
      });

      it('throws when passing events emitted by the indirectly called contract', function () {
        should.Throw(() => expectEvent.inLogs(this.logs, 'IndirectString', { value: this.value }));
      });
    });
  });

  describe('inTransaction', function () {
    describe('when emitting from called contract and indirect calls', function () {
      context('string value', function () {
        beforeEach(async function () {
          this.secondEmitter = await IndirectEventEmitter.new();

          this.value = 'OpenZeppelin';
          const receipt = await this.emitter.emitStringAndEmitIndirectly(this.value, this.secondEmitter.address);
          this.txHash = receipt.tx;
        });

        context('with directly called contract', function () {
          it('accepts emitted events with correct string', async function () {
            await expectEvent.inTransaction(this.txHash, EventEmitter, 'String', { value: this.value });
          });

          it('throws if an unemitted event is requested', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, EventEmitter, 'UnemittedEvent',
              { value: this.value }
            ));
          });

          it('throws if an incorrect string is passed', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, EventEmitter, 'String',
              { value: 'ClosedZeppelin' }
            ));
          });

          it('throws if an event emitted from other contract is passed', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, EventEmitter, 'IndirectString',
              { value: this.value }
            ));
          });

          it('throws if an incorrect emitter is passed', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, IndirectEventEmitter, 'String',
              { value: this.value }
            ));
          });
        });

        context('with indirectly called contract', function () {
          it('accepts events emitted from other contracts', async function () {
            await expectEvent.inTransaction(this.txHash, IndirectEventEmitter, 'IndirectString',
              { value: this.value }
            );
          });

          it('throws if an unemitted event is requested', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, IndirectEventEmitter, 'UnemittedEvent',
              { value: this.value }
            ));
          });

          it('throws if an incorrect string is passed', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, IndirectEventEmitter, 'IndirectString',
              { value: 'ClosedZeppelin' }
            ));
          });

          it('throws if an event emitted from other contract is passed', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, IndirectEventEmitter, 'String',
              { value: this.value }
            ));
          });

          it('throws if an incorrect emitter is passed', async function () {
            await shouldFail(expectEvent.inTransaction(this.txHash, EventEmitter, 'IndirectString',
              { value: this.value }
            ));
          });
        });
      });
    });
  });
});
