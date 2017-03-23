export default async promise => {
  try {
    await promise;
  } catch (error) {
    // TODO: Check jump destination to destinguish between a throw
    //       and an actual invalid jump.
    const invalidJump = error.message.search('invalid JUMP') >= 0;
    assert(invalidJump, "Expected throw, got '" + error + "' instead");
    return;
  }
  assert.fail('Expected throw not received');
};
