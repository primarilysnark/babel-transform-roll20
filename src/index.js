const babelParser = require('@babel/parser')
const fs = require('fs')
const path = require('path')

const moduleIdentifier = 'modules'
const fileRegExp = /(?:(\.*)\/((?:[A-Za-z0-9-]+\/)*))([A-Za-z0-9-]+)/

module.exports = function roll20Transform ({ types: t }) {
  function getFileContents (filePath, roots) {
    try {
      const file = fs.readFileSync(filePath, {
        encoding: 'UTF-8'
      })

      roots.push(path.parse(filePath).dir.slice(1))

      return file
    } catch (exception) {
      if (exception.code !== 'ENOENT') {
        throw exception
      }

      const file = fs.readFileSync(filePath.slice(0, -3) + '/index.js', {
        encoding: 'UTF-8'
      })

      roots.push(filePath.slice(1, -3))

      return file
    }
  }

  function getModule (basePath) {
    const program = basePath.findParent((parent) => parent.isProgram())
    const currentRoot = program.__roots[program.__roots_index]

    const filePath = `/${path.join(currentRoot, basePath.node.source.value)}`
    const file = path.parse(filePath)
    const moduleName = `'${path.relative(process.cwd(), `${file.dir}/${file.ext && file.base.endsWith(file.ext) ? file.base.slice(0, -file.ext.length) : file.base}`)}'`

    if (!program.__visited_files[filePath]) {
      let fileContents = getFileContents(`${file.dir}/${file.base}${file.ext && file.base.endsWith(file.ext) ? '' : '.js'}`, program.__roots)

      switch (file.ext) {
        case '.json':
          fileContents = `export default ${fileContents.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')}`
          break

        default:
          break
      }

      const module = t.blockStatement(
        babelParser.parse(fileContents, {
          sourceType: 'module'
        }).program.body
      )

      program.unshiftContainer('body', t.variableDeclarator(
        t.memberExpression(
          t.identifier('modules'),
          t.identifier(moduleName),
          true
        ),
        t.callExpression(
          t.parenthesizedExpression(
            t.functionExpression(
              null,
              [],
              module
            )
          ),
          []
        )
      ))
    }

    return moduleName
  }

  return {
    name: 'babel-transform-roll20',
    visitor: {
      Program: {
        enter (program) {
          program.__roots = [path.relative(process.cwd(), fileRegExp.exec(program.hub.file.opts.filename)[2])]
          program.__roots_index = 0
          program.__visited_files = {}
        },
        exit (path) {
          path.unshiftContainer('body', t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(moduleIdentifier),
              t.identifier('{}')
            )
          ]))
        }
      },
      BlockStatement: {
        enter (path) {
          const ancestor = path.parentPath.parentPath.parentPath.parentPath

          if (ancestor.node.id && ancestor.node.id.object && ancestor.node.id.object.name === 'modules' && t.isProgram(ancestor.parentPath.node)) {
            const program = path.findParent((parent) => parent.isProgram())
            program.__roots_index++

            path.__module = true
            path.__exports = {}
          }
        },
        exit (path) {
          if (path.__module && Object.keys(path.__exports).length !== 0) {
            const program = path.findParent((parent) => parent.isProgram())
            program.__roots.unshift()

            path.__module = false

            const exportAllKeys = Object.keys(path.__exports).filter(exportKey => exportKey.startsWith('__export__') && exportKey !== '__export__default')
            const exportKeys = Object.keys(path.__exports).filter(exportKey => !exportKey.startsWith('__export__') || exportKey === '__export__default')

            path.pushContainer('body', t.returnStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier('Object'),
                  t.identifier('assign')
                ),
                [
                  t.objectExpression([]),
                  ...exportAllKeys.map(exportKey => t.identifier(exportKey)),
                  t.objectExpression(exportKeys.map(exportKey => {
                    const exportValue = path.__exports[exportKey]

                    if (exportKey === '__export__default') {
                      return t.objectProperty(t.identifier('default'), exportValue === true ? t.identifier(exportKey) : exportValue)
                    }

                    return t.objectProperty(t.identifier(exportKey), exportValue === true ? t.identifier(exportKey) : exportValue)
                  }))
                ]
              )
            ))
          }
        }
      },
      ExportAllDeclaration: {
        exit (path) {
          const exportBlock = path.findParent((parent) => parent.__module)
          if (!exportBlock) {
            return
          }

          const moduleName = getModule(path)
          const exportName = `__export__${moduleName.slice(1, -1).replace(/[/-.]/g, '_')}`

          exportBlock.__exports[exportName] = true

          path.replaceWith(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(exportName),
                t.memberExpression(
                  t.identifier('modules'),
                  t.identifier(moduleName),
                  true
                )
              )
            ])
          )
        }
      },
      ExportDefaultDeclaration: {
        exit (path) {
          const exportBlock = path.findParent((parent) => parent.__module)
          if (!exportBlock) {
            return
          }

          exportBlock.__exports['__export__default'] = path.node.declaration.id || true

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
        }
      },
      ExportNamedDeclaration: {
        exit (path) {
          const exportBlock = path.findParent((parent) => parent.__module)

          if (!exportBlock) {
            return
          }

          switch (path.node.declaration.type) {
            case 'ClassDeclaration':
              exportBlock.__exports[path.node.declaration.id.name] = true
              path.replaceWith(path.node.declaration)
              break

            case 'FunctionDeclaration':
              exportBlock.__exports[path.node.declaration.id.name] = true
              path.replaceWith(path.node.declaration)
              break

            case 'VariableDeclaration':
              path.replaceWithMultiple(
                path.node.declaration.declarations.map(declarator => {
                  exportBlock.__exports[declarator.id.name] = true

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
              throw new Error(`Unsupported export type: '${path.node.declaration.type}'`)
          }
        }
      },
      ImportDeclaration: {
        exit (path) {
          const moduleName = getModule(path)

          path.replaceWithMultiple(
            path.node.specifiers.map(specifier => {
              switch (specifier.type) {
                case 'ImportDefaultSpecifier':
                  return t.variableDeclaration('const', [
                    t.variableDeclarator(
                      t.identifier(specifier.local.name),
                      t.memberExpression(
                        t.memberExpression(
                          t.identifier('modules'),
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
                          t.identifier('modules'),
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
                        t.identifier('modules'),
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
}
