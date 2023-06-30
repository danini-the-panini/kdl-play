import EditorWorker from 'url:monaco-editor/esm/vs/editor/editor.worker.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js'
import * as KDL from 'kdljs'

import kdlMonarch from './kdl.monarch'

self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		return EditorWorker
	}
}

monaco.languages.register({ id: 'kdl' });
monaco.languages.setMonarchTokensProvider('kdl', kdlMonarch)

addEventListener("DOMContentLoaded", (event) => {
  const input = monaco.editor.create(document.getElementById('input'), {
    value: 'foo 1 "two" three=0xff {\n  bar true false null\n}',
    language: 'kdl'
  })
  const model = input.getModel()
  const output = document.getElementById('output')

  function parse() {
    try {
      let result = KDL.parse(input.getValue())
      output.textContent = JSON.stringify(result, null, 2)

      const markers = []
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
      monaco.editor.setModelMarkers(model, "owner", markers);

    } catch (error) {
      console.error(error)
    }
  }

  model.onDidChangeContent(parse)

  parse()
})
