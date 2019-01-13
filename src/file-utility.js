const fs = require('fs')

function tryReadFileSync (filePath) {
  try {
    return fs.readFileSync(filePath, {
      encoding: 'UTF-8'
    })
  } catch (exception) {
    if (exception.code !== 'ENOENT') {
      throw exception
    }
  }
}

function tryReadFile (file) {
  const fileExtension = file.ext && file.base.endsWith(file.ext) ? '' : '.js'
  const filePath = `${file.dir}/${file.base}${fileExtension}`

  const contents = tryReadFileSync(filePath)

  if (contents === undefined) {
    return
  }

  return {
    contents,
    root: file.dir.slice(1)
  }
}

function tryReadIndexFile (file) {
  const filePath = `${file.dir}/${file.base}/index.js`

  const contents = tryReadFileSync(filePath)

  if (contents === undefined) {
    return
  }

  return {
    contents,
    root: filePath.slice(1, -8)
  }
}

module.exports = {
  get: function (file) {
    return tryReadFile(file) || tryReadIndexFile(file)
  },
  format: function (file, contents) {
    switch (file.ext) {
      case '.json':
        return `export default ${contents
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029')}`

      default:
        return contents
    }
  }
}
