export default class ExampleClass {
  constructor () {
    this.property = 'example'
  }

  static staticMethod () {
    console.log('static')
  }

  method () {
    console.log('method')
  }
}

export class ClassA {
  constructor () {
    this.property = 'classA'
  }

  static staticMethod () {
    console.log('static')
  }

  method () {
    console.log('method')
  }
}
