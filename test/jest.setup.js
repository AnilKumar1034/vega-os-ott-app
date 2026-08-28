if (typeof jest !== 'undefined') {
  jest.now = () => Date.now();
}

if (typeof global !== 'undefined') {
  global.requestAnimationFrame = function (callback) {
    return setTimeout(() => callback(Date.now()), 0);
  };
}


