/* eslint-disable no-new-func */

const AsyncFunction = (async function(){}).constructor;

function compileCode(code) {
  return new Function('context', 'wwFormulas', 'integrations', code);
}

function compileCodeAsync(code) {
  return new AsyncFunction('context', 'wwFormulas', 'integrations', code);
}

export { compileCode, compileCodeAsync }; 