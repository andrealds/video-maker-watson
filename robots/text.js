const algorithmia = require('algorithmia')
const algorithmiaApikey = require('../credentials/algorithmia.json').api_Key
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
 await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)

  async function fetchContentFromWikipedia(content) {
    const algorithmiaAuthenticated = algorithmia(algorithmiaApikey)
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2?timeout=300")
    const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
    const wikipediaContent = wikipediaResponde.get()

    
    content.sourceContentOriginal = wikipediaContent.content
  }
  function sanitizeContent(content) {
    const withoutBlankLinesAndMarkDown = removeBlankLinesAndMarkDown(content.sourceContentOriginal)
    const withoutDatesInParenthes = removeDatesInParenthes(withoutBlankLinesAndMarkDown)

    content.sourceContentSanitized = withoutDatesInParenthes

    
    function removeBlankLinesAndMarkDown(text) {
      const allLines = text.split('/n')
      const withoutBlankLinesAndMarkDown = allLines.filter((line) => {
        if (line.trim().length === 0 || line.trim().startsWith('=')) {
          return false
        }
        return true
      })
      return withoutBlankLinesAndMarkDown.join(' ')
    }
    function removeDatesInParenthes(text) {
      return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }
  }
  function breakContentIntoSentences(content) {
    content.sentences = []
    const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
    sentences.forEach((sentence) => {
      content.sentences.push({
        text: sentence,
        keywords: [],
        images:[]
      })
    })
  }
}
module.exports = robot