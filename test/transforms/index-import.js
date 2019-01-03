const modules = {};
modules['test/fixtures/index-import-folder'] = (function () {
  const __export__default = {
    key: 'value'
  };
  return Object.assign({}, {
    default: __export__default
  });
})()
const exampleIndex = modules['test/fixtures/index-import-folder'].default;
console.log(exampleIndex);