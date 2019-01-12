(function () {
  const modules = {};
  modules['test/fixtures/import-all/object-b'] = (function () {
    const objectB = {
      key: 'value'
    };
    return Object.assign({}, {
      objectB: objectB
    });
  })();
  modules['test/fixtures/import-all/object-a'] = (function () {
    const objectA = {
      key: 'value'
    };
    return Object.assign({}, {
      objectA: objectA
    });
  })();
  modules['test/fixtures/import-all/objects'] = (function () {
    const __export__test_fixtures_import_all_object_a = modules['test/fixtures/import-all/object-a'];
    const __export__test_fixtures_import_all_object_b = modules['test/fixtures/import-all/object-b'];
    return Object.assign({}, __export__test_fixtures_import_all_object_a, __export__test_fixtures_import_all_object_b, {});
  })();
  const objects = modules['test/fixtures/import-all/objects'];
  console.log(objects.objectA, objects.objectB);
})();