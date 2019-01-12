const babelParser = require('@babel/parser')
const fs = require('fs')
const path = require('path')

const moduleIdentifier = 'modules'
const fileRegExp = /(?:(\.*)\/((?:[A-Za-z0-9-]+\/)*))([A-Za-z0-9-]+)/

function getFileContents (file) {
  const fileExtension = file.ext && file.base.endsWith(file.ext) ? '' : '.js'
  const filePath = `${file.dir}/${file.base}${fileExtension}`

  try {
    const fileContents = fs.readFileSync(filePath, {
      encoding: 'UTF-8'
    })

    return {
      contents: fileContents,
      root: file.dir.slice(1)
    }
  } catch (exception) {
    if (exception.code !== 'ENOENT') {
      throw exception
    }

    const fileContents = fs.readFileSync(filePath.slice(0, -3) + '/index.js', {
      encoding: 'UTF-8'
    })

    return {
      contents: fileContents,
      root: filePath.slice(1, -3)
    }
  }
}

function processFileContents (file, contents) {
  switch (file.ext) {
    case '.json':
      return `export default ${contents
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')}`

    default:
      return contents
  }
}

module.exports = function roll20Transform ({ types: t }) {
  function getModule (basePath) {
    const currentRoot = this.roots.resolvers[this.roots.index]

    const filePath = `/${path.join(currentRoot, basePath.node.source.value)}`
    const file = path.parse(filePath)
    const moduleName = `'${path.relative(
      process.cwd(),
      `${file.dir}/${
        file.ext && file.base.endsWith(file.ext)
          ? file.base.slice(0, -file.ext.length)
          : file.base
      }`
    )}'`

    if (this.modules.cache.includes(moduleName)) {
      return moduleName
    }

    let { contents, root } = getFileContents(file)

    this.modules.cache.push(moduleName)
    this.roots.resolvers.push(root)

    const module = t.blockStatement(
      babelParser.parse(processFileContents(file, contents), {
        sourceType: 'module'
      }).program.body
    )

    this.modules.root.insertAfter(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(
            t.identifier(moduleIdentifier),
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

  return {
    name: 'babel-transform-roll20',
    pre () {
      this.replacedNodes = new WeakSet()
      this.processedModules = new WeakMap()

      this.modules = {
        cache: [],
        root: null,
        get: getModule.bind(this)
      }

      this.roots = {
        resolvers: [],
        index: 0
      }
    },
    visitor: {
      Program: {
        enter (program) {
          if (this.replacedNodes.has(program.node)) {
            return
          }

          this.roots.resolvers.push(
            path.relative(
              process.cwd(),
              fileRegExp.exec(program.hub.file.opts.filename)[2]
            )
          )
          this.roots.index = 0

          program.unshiftContainer(
            'body',
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(moduleIdentifier),
                t.identifier('{}')
              )
            ])
          )

          program.replaceWith(
            t.program([
              t.expressionStatement(
                t.callExpression(
                  t.functionExpression(
                    null,
                    [],
                    t.blockStatement(program.node.body)
                  ),
                  []
                )
              )
            ])
          )

          this.replacedNodes.add(program.node)
        }
      },
      VariableDeclaration (path) {
        if (!path.node.declarations || path.node.declarations.length !== 1) {
          return
        }

        const [declaration] = path.node.declarations

        if (declaration.id.name !== moduleIdentifier) {
          return
        }

        this.modules.root = path
      },
      BlockStatement: {
        enter (path) {
          const ancestor = path.parentPath.parentPath.parentPath.parentPath

          if (
            t.isAssignmentExpression(ancestor.node) &&
            t.isMemberExpression(ancestor.node.left) &&
            ancestor.node.left.object.name === moduleIdentifier
          ) {
            this.roots.index++
            this.processedModules.set(path.node, {})
          }
        },
        exit (path) {
          if (!this.processedModules.has(path.node)) {
            return
          }

          const exportDeclarations = this.processedModules.get(path.node)
          if (Object.keys(exportDeclarations).length === 0) {
            return
          }

          this.roots.resolvers.unshift()

          const exportAllKeys = Object.keys(exportDeclarations).filter(
            exportKey =>
              exportKey.startsWith('__export__') &&
              exportKey !== '__export__default'
          )
          const exportKeys = Object.keys(exportDeclarations).filter(
            exportKey =>
              !exportKey.startsWith('__export__') ||
              exportKey === '__export__default'
          )

          this.processedModules.delete(path.node)

          path.pushContainer(
            'body',
            t.returnStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier('Object'),
                  t.identifier('assign')
                ),
                [
                  t.objectExpression([]),
                  ...exportAllKeys.map(exportKey => t.identifier(exportKey)),
                  t.objectExpression(
                    exportKeys.map(exportKey => {
                      const exportValue = exportDeclarations[exportKey]

                      if (exportKey === '__export__default') {
                        return t.objectProperty(
                          t.identifier('default'),
                          exportValue === true
                            ? t.identifier(exportKey)
                            : exportValue
                        )
                      }

                      return t.objectProperty(
                        t.identifier(exportKey),
                        exportValue === true
                          ? t.identifier(exportKey)
                          : exportValue
                      )
                    })
                  )
                ]
              )
            )
          )
        }
      },
      ExportAllDeclaration (path) {
        const exportBlock = path.findParent(parent =>
          this.processedModules.has(parent.node)
        )
        if (!exportBlock) {
          return
        }

        const moduleName = this.modules.get(path)
        const exportName = `__export__${moduleName
          .slice(1, -1)
          .replace(/[./-]/g, '_')}`

        this.processedModules.set(exportBlock.node, {
          ...this.processedModules.get(exportBlock.node),
          [exportName]: true
        })

        path.replaceWith(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(exportName),
              t.memberExpression(
                t.identifier(moduleIdentifier),
                t.identifier(moduleName),
                true
              )
            )
          ])
        )
      },
      ExportDefaultDeclaration (path) {
        const exportBlock = path.findParent(parent =>
          this.processedModules.has(parent.node)
        )
        if (!exportBlock) {
          return
        }

        this.processedModules.set(exportBlock.node, {
          ...this.processedModules.get(exportBlock.node),
          __export__default: path.node.declaration.id || true
        })

        switch (path.node.declaration.type) {
          case 'ClassDeclaration':
            path.replaceWith(
              t.classDeclaration(
                path.node.declaration.id || t.identifier('__export__default'),
                path.node.declaration.superClass,
                path.node.declaration.body
              )
            )
            break

          case 'FunctionDeclaration':
            path.replaceWith(
              t.functionDeclaration(
                path.node.declaration.id || t.identifier('__export__default'),
                path.node.declaration.params,
                path.node.declaration.body,
                path.node.declaration.generator,
                path.node.declaration.async
              )
            )
            break

          default:
            path.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier('__export__default'),
                  path.node.declaration
                )
              ])
            )
            break
        }
      },
      ExportNamedDeclaration (path) {
        const exportBlock = path.findParent(parent =>
          this.processedModules.has(parent.node)
        )
        if (!exportBlock) {
          return
        }

        switch (path.node.declaration.type) {
          case 'ClassDeclaration':
          case 'FunctionDeclaration':
            this.processedModules.set(exportBlock.node, {
              ...this.processedModules.get(exportBlock.node),
              [path.node.declaration.id.name]: true
            })

            path.replaceWith(path.node.declaration)
            break

          case 'VariableDeclaration':
            path.replaceWithMultiple(
              path.node.declaration.declarations.map(declarator => {
                this.processedModules.set(exportBlock.node, {
                  ...this.processedModules.get(exportBlock.node),
                  [declarator.id.name]: true
                })

                return t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(declarator.id.name),
                    declarator.init
                  )
                ])
              })
            )
            break

          default:
            throw new Error(
              `Unsupported export type: '${path.node.declaration.type}'`
            )
        }
      },
      ImportDeclaration (path) {
        const moduleName = this.modules.get(path)

        path.replaceWithMultiple(
          path.node.specifiers.map(specifier => {
            switch (specifier.type) {
              case 'ImportDefaultSpecifier':
                return t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(specifier.local.name),
                    t.memberExpression(
                      t.memberExpression(
                        t.identifier(moduleIdentifier),
                        t.identifier(moduleName),
                        true
                      ),
                      t.identifier('default')
                    )
                  )
                ])

              case 'ImportSpecifier':
                return t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(specifier.local.name),
                    t.memberExpression(
                      t.memberExpression(
                        t.identifier(moduleIdentifier),
                        t.identifier(moduleName),
                        true
                      ),
                      t.identifier(specifier.imported.name)
                    )
                  )
                ])

              case 'ImportNamespaceSpecifier':
                return t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(specifier.local.name),
                    t.memberExpression(
                      t.identifier(moduleIdentifier),
                      t.identifier(moduleName),
                      true
                    )
                  )
                ])

              default:
                throw new Error(`Unsupported import type: ${specifier.type}`)
            }
          })
        )
      }
    }
  }
}
