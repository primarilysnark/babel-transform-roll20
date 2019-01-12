(function () {
  const modules = {};
  modules['test/fixtures/multiple-folders-b/object-d'] = (function () {
    const objectD = {
      key: 'value'
    };
    return Object.assign({}, {
      objectD: objectD
    });
  })();
  modules['test/fixtures/multiple-folders-a/object-b'] = (function () {
    const objectB = {
      key: 'value'
    };
    return Object.assign({}, {
      objectB: objectB
    });
  })();
  modules['test/fixtures/multiple-folders-b/object-c'] = (function () {
    const objectD = modules['test/fixtures/multiple-folders-b/object-d'].objectD;
    const __export__default = objectD;
    return Object.assign({}, {
      default: __export__default
    });
  })();
  modules['test/fixtures/multiple-folders-a/object-a'] = (function () {
    const objectB = modules['test/fixtures/multiple-folders-a/object-b'].objectB;
    const __export__default = objectB;
    return Object.assign({}, {
      default: __export__default
    });
  })();
  const objectA = modules['test/fixtures/multiple-folders-a/object-a'].default;
  const objectC = modules['test/fixtures/multiple-folders-b/object-c'].default;
  console.log(objectA, objectB);
})();