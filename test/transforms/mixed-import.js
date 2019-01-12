(function () {
  const modules = {};
  modules['test/fixtures/mixed-import/class'] = (function () {
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

    class ClassA {
      constructor() {
        this.property = 'classA';
      }

      static staticMethod() {
        console.log('static');
      }

      method() {
        console.log('method');
      }

    }

    return Object.assign({}, {
      default: ExampleClass,
      ClassA: ClassA
    });
  })();
  modules['test/fixtures/mixed-import/object'] = (function () {
    const __export__default = {
      key: 'value'
    };
    const objectA = {
      key: 'value'
    };
    return Object.assign({}, {
      default: __export__default,
      objectA: objectA
    });
  })();
  const objectDefault = modules['test/fixtures/mixed-import/object'].default;
  const objectA = modules['test/fixtures/mixed-import/object'].objectA;
  const ClassDefault = modules['test/fixtures/mixed-import/class'].default;
  const ClassA = modules['test/fixtures/mixed-import/class'].ClassA;
  console.log(objectDefault, objectA);
  const classDefault = new ClassDefault();
  const classA = new ClassA();
})();