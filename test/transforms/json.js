const modules = {};
modules['test/fixtures/json/content'] = (function () {
  const __export__default = {
    "key": "value",
    "array": ["value", "value"],
    "nested": {
      "key": "value"
    }
  };
  return Object.assign({}, {
    default: __export__default
  });
})()
const content = modules['test/fixtures/json/content'].default;
console.log(content);