const babelParser = require('@babel/parser')
const fileUtil = require('./file-utility')
const path = require('path')

module.exports = class ModuleLoader {
  constructor (identifier, state, t) {
    this.modules = new WeakMap()
    this.cache = new Set()
    this.root = undefined
    this.identifier = identifier

    this.t = t

    this.roots = {
      resolvers: [
        path.relative(
          process.cwd(),
          path.parse(state.hub.file.opts.filename).dir
        )
      ],
      index: 0
    }
  }

  setRoot (node) {
    this.root = node
  }

  findOrCreate (modulePath) {
    const t = this.t

    const currentRoot = this.roots.resolvers[this.roots.index]

    const filePath = `./${path.join(
      currentRoot,
      modulePath.node.source.value
    )}`
    const file = path.parse(filePath)

    const moduleName = `'${path.relative(
      process.cwd(),
      `${file.dir}/${
        file.ext && file.base.endsWith(file.ext)
          ? file.base.slice(0, -file.ext.length)
          : file.base
      }`
    )}'`

    if (this.cache.has(moduleName)) {
      return moduleName
    }

    let { contents, root } = fileUtil.get(file)

    this.cache.add(moduleName)
    this.roots.resolvers.push(root)

    const module = t.blockStatement(
      babelParser.parse(fileUtil.format(file, contents), {
        sourceType: 'module'
      }).program.body
    )

    this.root.insertAfter(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(
            t.identifier(this.identifier),
            t.identifier(moduleName),
            true
          ),
          t.callExpression(
            t.parenthesizedExpression(t.functionExpression(null, [], module)),
            []
          )
        )
      )
    )

    return moduleName
  }
}
