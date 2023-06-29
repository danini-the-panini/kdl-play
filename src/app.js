import { parse } from 'kdljs'

addEventListener("DOMContentLoaded", (event) => {
  const input = document.getElementById('input')
  const output = document.getElementById('output')

  function doParse() {
    try {
      let result = parse(input.value)

      output.textContent = JSON.stringify(result, null, 2)
    } catch (error) {
      console.error(error)
    }
  }

  input.addEventListener('input', doParse)

  doParse()
})
