const babelParser = require('@babel/parser')
const fs = require('fs')

const moduleIdentifier = 'modules'
const fileRegExp = /(?:(\.*)\/((?:[A-Za-z0-9-]+\/)*))([A-Za-z0-9-]+)/

module.exports = function roll20Transform ({ types: t }) {
  return {
    name: 'babel-transform-roll20',
    visitor: {
      Program: {
        enter (path) {
          path.__roots = fileRegExp.exec(path.hub.file.opts.filename)[2].split('/').filter(path => path !== '')
          path.__visited_files = {}
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

          if (ancestor.node.id && ancestor.node.id.object.name === 'modules' && t.isProgram(ancestor.parentPath.node)) {
            path.__module = true
            path.__exports = {}
          }
        },
        exit (path) {
          if (path.__module && Object.keys(path.__exports).length !== 0) {
            path.__module = false

            path.pushContainer('body', t.returnStatement(
              t.objectExpression(
                Object.keys(path.__exports).map(exportKey => {
                  const exportValue = path.__exports[exportKey]

                  if (exportKey === '__export__default') {
                    return t.objectProperty(t.identifier('default'), exportValue === true ? t.identifier(exportKey) : exportValue)
                  }

                  return t.objectProperty(t.identifier(exportKey), exportValue === true ? t.identifier(exportKey) : exportValue)
                })
              )
            ))
          }
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
        enter (path) {
          const [, dotStart, fileRoot, fileName] = fileRegExp.exec(path.node.source.value)
          const programPath = path.findParent((parent) => parent.isProgram())

          if (dotStart.length === 2) {
            programPath.__roots.pop()
          }

          if (fileRoot.length !== 0 && programPath.__roots[programPath.__roots.length - 1] !== fileRoot) {
            programPath.__roots.push(fileRoot)
          }

          const modulePath = `/${programPath.__roots.join('/')}${fileName}.js`
          const moduleName = `'${modulePath.slice(process.cwd().length + 1, -3)}'`

          if (!programPath.__visited_files[modulePath]) {
            const moduleContents = fs.readFileSync(modulePath, {
              encoding: 'UTF-8'
            })

            const parsedModule = babelParser.parse(moduleContents, {
              sourceType: 'module'
            }).program.body

            programPath.unshiftContainer('body', t.variableDeclarator(
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
                    t.blockStatement(
                      parsedModule
                    )
                  )
                ),
                []
              )
            ))
          }

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
              }
            })
          )

          programPath.__visited_files[fileName] = true
        },
        exit (path) {
          path.findParent((parent) => parent.isProgram()).__roots.pop()
        }
      }
    }
  }
}
