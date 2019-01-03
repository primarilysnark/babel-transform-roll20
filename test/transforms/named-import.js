const modules = {};
modules['test/fixtures/named-import/object'] = (function () {
  const objectA = {
    key: 'a'
  };
  const objectB = {
    key: 'b'
  };
  return {
    objectA: objectA,
    objectB: objectB
  };
})()
modules['test/fixtures/named-import/function'] = (function () {
  function example() {
    return 'example';
  }

  return {
    example: example
  };
})()
modules['test/fixtures/named-import/class'] = (function () {
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

  return {
    ExampleClass: ExampleClass
  };
})()
const ExampleClass = modules['test/fixtures/named-import/class'].ExampleClass;
const exampleFunction = modules['test/fixtures/named-import/function'].exampleFunction;
const objectA = modules['test/fixtures/named-import/object'].objectA;
const objectBRenamed = modules['test/fixtures/named-import/object'].objectB;
const exampleClass = new ExampleClass();
exampleFunction();
console.log(objectA, objectB);