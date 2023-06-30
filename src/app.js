import EditorWorker from 'url:monaco-editor/esm/vs/editor/editor.worker.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js'
import * as KDL from 'kdljs'

import kdlMonarch from './kdl.monarch'

self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		return EditorWorker
	}
}

monaco.languages.register({ id: 'kdl' })
monaco.languages.setMonarchTokensProvider('kdl', kdlMonarch)

function addTag(el, tag) {
  if (!tag) return
  const tagEl = document.createElement('span')
  tagEl.classList.add('tag')
  tagEl.textContent = tag
  el.append(tagEl)
}

function buildValue(value) {
  const valueEl = document.createElement('span')
  if (value === null) {
    valueEl.textContent = "null"
    valueEl.classList.add('null')
  } else if (value === true || value === false) {
    valueEl.textContent = value ? 'true' : 'false'
    valueEl.classList.add('boolean')
  } else if (typeof value === "string") {
    valueEl.textContent = JSON.stringify(value)
    valueEl.classList.add('string')
  } else {
    valueEl.textContent = value.toString()
    valueEl.classList.add('number')
  }
  return valueEl
}

/**
 * @param {KDL.kdljs.Node} node 
 * @returns {HTMLElement}
 */
function buildNodeTree(node) {
  const nodeEl = document.createElement('div')
  nodeEl.classList.add('node')
  nodeEl.classList.add('open')
  const nameEl = document.createElement('button')
  nameEl.addEventListener('click', () => nodeEl.classList.toggle('open'))
  nameEl.classList.add('name')
  addTag(nameEl, node.tags.name)
  nameEl.append(document.createTextNode(node.name))
  nodeEl.append(nameEl)
  const contentEl = document.createElement('ul')
  contentEl.classList.add('content')
  node.values.forEach((value, index) => {
    const valueEl = document.createElement('li')
    valueEl.classList.add('value')
    addTag(valueEl, node.tags.values[index])
    valueEl.append(buildValue(value))
    contentEl.append(valueEl)
  })
  Object.entries(node.properties).forEach(([key, value]) => {
    const propEl = document.createElement('li')
    propEl.classList.add('property')
    const keyEl = document.createElement('span')
    keyEl.classList.add('key')
    keyEl.textContent = key
    propEl.append(keyEl)
    addTag(propEl, node.tags.properties[key])
    propEl.append(buildValue(value))
    contentEl.append(propEl)
  })
  node.children.forEach(child => {
    contentEl.append(buildNodeTree(child))
  })
  nodeEl.append(contentEl)

  return nodeEl
}

addEventListener("DOMContentLoaded", (event) => {
  const editor = monaco.editor.create(document.getElementById('input'), {
    value: 'foo 1 "two" three=(decimal)0xff {\n  (thing)bar true false null\n}',
    language: 'kdl'
  })
  window.addEventListener('resize', () => {
    editor.layout()
  })
  const model = editor.getModel()
  const output = document.getElementById('output')

  function parse() {
    try {
      let result = KDL.parse(model.getValue())
      const hasErrors = result.errors.length > 0
      output.classList.toggle('error', hasErrors)

      const markers = []
      if (hasErrors) {
        result.errors.forEach(error => {
          markers.push({
            message: error.name,
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: error.token.startLine,
            startColumn: error.token.startColumn,
            endLineNumber: error.token.endLine,
            endColumn: error.token.endColumn,
          })
        })
      } else {
        output.innerHTML = ''
        result.output.forEach(node => {
          output.append(buildNodeTree(node))
        })
      }
      monaco.editor.setModelMarkers(model, "owner", markers)

    } catch (error) {
      console.error(error)
    }
  }

  model.onDidChangeContent(parse)

  parse()
})
