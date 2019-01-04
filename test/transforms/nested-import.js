const modules = {};
modules['test/fixtures/nested-import/level-c/level-d'] = (function () {
  const __export__default = {
    key: 'value'
  };
  return Object.assign({}, {
    default: __export__default
  });
})()
modules['test/fixtures/nested-import/level-c'] = (function () {
  const levelD = modules['test/fixtures/nested-import/level-c/level-d'].default;
  const __export__default = levelD;
  return Object.assign({}, {
    default: __export__default
  });
})()
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
  const levelC = modules['test/fixtures/nested-import/level-c'].default;
  const __export__default = {
    levelB: levelB,
    levelC: levelC
  };
  return Object.assign({}, {
    default: __export__default
  });
})()
const levelA = modules['test/fixtures/nested-import/level-a'].default;
console.log(levelA);