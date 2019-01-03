import {ExampleClass} from './named-import/class'
import {exampleFunction} from './named-import/function'
import {objectA, objectB as objectBRenamed} from './named-import/object'

const exampleClass = new ExampleClass()
exampleFunction()
console.log(objectA, objectB)
