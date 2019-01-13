# babel-transform-roll20
> This plugin allows Babel to transform import and export statements to support the Roll20 API sandbox.

## Introduction
[Roll20](https://roll20.net/) is a virtual tabletop application that allows pen-and-paper games online. As part of this experience, Roll20 Pro Users are able to write their own scripts for interacting with the application, ranging from simple macros to complex chat bots and campaign tool managers. These scripts run within the [Roll20 API Sandbox](https://wiki.roll20.net/API:Sandbox_Model), a restricted Node.js virtual machine, and have limitations imposed on them for security or simplicity reasons.

One of these limitations is the removal of Node.js's [built-in module system](https://nodejs.org/api/modules.html). Scripts are self-contained and restricted to a single file. While this limitation is not a problem for smaller scripts, it makes writing and maintaining larger scripts that would traditionally occupy multiple modules painful.

Into this gap steps `babel-transform-roll20` for transforming `import` / `export` syntax module loads into a single file for use within Roll20 in a manner similar to [webpack](https://webpack.js.org), but compliant with the technical limitations of the Roll20 API Sandbox.

## Example
### Original File
```js
// ./imported-file.js
export const exportedObject = {
  a: 1,
  b: 2
}

// ./index-file.js
import { exportedObject } from './imported-file'

console.log(exportedObject.a); // 2
```

### Transformed File
```js
const modules = {}
modules['./imported-file'] = (function () {
  const exportedObject = {
    a: 1,
    b: 2
  };
  
  return {
    exportedObject: exportedObject
  };
})();
const exportedObject = modules['./imported-file'].exportedObject;
console.log(exportedObject.a);
```
