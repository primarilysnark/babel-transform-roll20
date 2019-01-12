import objectDefault, { objectA } from './mixed-import/object'
import ClassDefault, { ClassA } from './mixed-import/class'

console.log(objectDefault, objectA)
const classDefault = new ClassDefault()
const classA = new ClassA()
