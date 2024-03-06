// Catches unhandled rejections (mainly from tests)
process.on('unhandledRejection', reason => {
  throw new Error(reason);
});
