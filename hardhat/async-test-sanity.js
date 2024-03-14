process.on('unhandledRejection', reason => {
  throw new Error(reason);
});
