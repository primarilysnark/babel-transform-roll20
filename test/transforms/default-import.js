const modules = {};
modules['test/fixtures/default-import/object'] = (function () {
  const __export__default = {
    key: 'value'
  };
  return Object.assign({}, {
    default: __export__default
  });
})()
modules['test/fixtures/default-import/function'] = (function () {
  function example() {
    return 'example';
  }

  return Object.assign({}, {
    default: example
  });
})()
modules['test/fixtures/default-import/class'] = (function () {
  class ExampleClass {
    constructor() {
      this.property = 'example';
    }

    static staticMethod() {
      console.log('static');
    }

    method() {
      console.log('method');
    }

  }

  return Object.assign({}, {
    default: ExampleClass
  });
})()
const ExampleClass = modules['test/fixtures/default-import/class'].default;
const exampleFunction = modules['test/fixtures/default-import/function'].default;
const exampleObject = modules['test/fixtures/default-import/object'].default;
const exampleClass = new ExampleClass();
exampleFunction();
console.log(exampleObject);