process.on('unhandledRejection', reason => {
  // If the reason is already an Error object, throw it directly to preserve the stack trace.
  if (reason instanceof Error) {
    throw reason;
  } else {
    // If the reason is not an Error (e.g., a string, number, or other primitive),
    // create a new Error object with the reason as its message.
    throw new Error(`Unhandled rejection: ${reason}`);
  }
});
