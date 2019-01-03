const modules = {};
modules['test/fixtures/nested-import/level-b'] = (function () {
  const __export__default = {
    key: 'value'
  };
  return Object.assign({}, {
    default: __export__default
  });
})()
modules['test/fixtures/nested-import/level-a'] = (function () {
  const levelB = modules['test/fixtures/nested-import/level-b'].default;
  const __export__default = levelB;
  return Object.assign({}, {
    default: __export__default
  });
})()
const levelA = modules['test/fixtures/nested-import/level-a'].default;
console.log(levelA);