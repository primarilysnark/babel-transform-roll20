(function () {
  const modules = {};
  modules['test/fixtures/index-import-folder/object'] = (function () {
    const objectA = {
      key: 'value'
    };
    return Object.assign({}, {
      objectA: objectA
    });
  })();
  modules['test/fixtures/index-import-folder'] = (function () {
    const __export__test_fixtures_index_import_folder_object = modules['test/fixtures/index-import-folder/object'];
    const __export__default = {
      key: 'value'
    };
    return Object.assign({}, __export__test_fixtures_index_import_folder_object, {
      default: __export__default
    });
  })();
  const exampleIndex = modules['test/fixtures/index-import-folder'].default;
  console.log(exampleIndex);
})();