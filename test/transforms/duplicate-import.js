(function () {
  const modules = {};
  modules['test/fixtures/duplicate-import/object-a'] = (function () {
    const __export__default = {
      key: 'value'
    };
    return Object.assign({}, {
      default: __export__default
    });
  })();
  modules['test/fixtures/duplicate-import/object-c'] = (function () {
    const objectA = modules['test/fixtures/duplicate-import/object-a'].default;
    const __export__default = objectA;
    return Object.assign({}, {
      default: __export__default
    });
  })();
  modules['test/fixtures/duplicate-import/object-b'] = (function () {
    const objectA = modules['test/fixtures/duplicate-import/object-a'].default;
    const __export__default = objectA;
    return Object.assign({}, {
      default: __export__default
    });
  })();
  const objectAInB = modules['test/fixtures/duplicate-import/object-b'].default;
  const objectAInC = modules['test/fixtures/duplicate-import/object-c'].default;
  console.log(objectAInB, objectAInC);
})();