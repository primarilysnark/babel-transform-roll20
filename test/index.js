import * as babel from '@babel/core'
import test from 'ava'
import fs from 'fs'

function transform (filePath) {
  return new Promise((resolve, reject) => {
    babel.transformFile(filePath, {
      babelrc: false,
      comments: false,
      plugins: ['./src/index.js']
    }, (err, result) => {
      if (err) {
        return reject(err)
      }

      return resolve(result)
    })
  })
}

function loadFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }

      return resolve(data)
    })
  })
}

test('transforms an empty file', async (t) => {
  const result = await loadFile('./test/transforms/empty.js')
  const {code} = await transform('./test/fixtures/empty.js')

  t.is(code, result)
})

test('transforms default exports', async (t) => {
  const result = await loadFile('./test/transforms/default-import.js')
  const {code} = await transform('./test/fixtures/default-import.js')

  t.is(code, result)
})

test('transforms named exports', async (t) => {
  const result = await loadFile('./test/transforms/named-import.js')
  const {code} = await transform('./test/fixtures/named-import.js')

  t.is(code, result)
})

test('transforms nested imports', async (t) => {
  const result = await loadFile('./test/transforms/nested-import.js')
  const {code} = await transform('./test/fixtures/nested-import.js')

  t.is(code, result)
})

test.only('transforms mixed imports', async (t) => {
  const result = await loadFile('./test/transforms/mixed-import.js')
  const {code} = await transform('./test/fixtures/mixed-import.js')

  t.is(code, result)
})
