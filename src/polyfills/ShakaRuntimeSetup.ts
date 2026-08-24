// @ts-nocheck
// The compiled Vega Shaka bundle evaluates device detection while it is being
// imported. React Native on Vega supplies navigator without a userAgent, so
// create the minimal browser shape before that bundle runs.
if (!global.window) {
  global.window = global;
}

if (!global.navigator) {
  global.navigator = {};
}

if (!global.navigator.userAgent) {
  global.navigator.userAgent = 'AFTCA001';
}

if (!global.window.XMLHttpRequest && global.XMLHttpRequest) {
  global.window.XMLHttpRequest = global.XMLHttpRequest;
}

export {};
