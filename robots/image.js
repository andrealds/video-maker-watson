const imageDownloader = require('image-downloader')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')

async function robot(){
  const content = state.load()
  await fetchImagesAllOffSentences(content)
  await downloadAllImages(content)
  state.save(content)

  async function fetchImagesAllOffSentences(content){
    for (const sentence of content.sentences){
      const query = `${content.searchTerm} ${sentence.keywords[0]}`
      sentence.images = await fetchGoogleAndReturnImagesLinks(query)

      sentence.googleSearchQuery = query
    }
  }


  async function fetchGoogleAndReturnImagesLinks(query){
    const response = await customSearch.cse.list({
      auth: googleSearchCredentials.apikey,
      cx: googleSearchCredentials.searchEngineId,
      q: query,
      searchType: 'image',
      imgSize: 'Huge',
      num: 2
    })
    const imagesUrl = response.data.items.map((item) => {
      return item.link
    })
    return imagesUrl
  }
  async function downloadAllImages(content){
    content.downloadedImages = []
    
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){
      const images = content.sentences[sentenceIndex].images
      
      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const imagesUrl = images[imageIndex]
        try {
          if (content.downloadedImages.includes(imagesUrl)) {
          throw new Error('Imagem já foi baixada') 
        }
        await downloadAndSave(imagesUrl, `${sentenceIndex}-original.png`)
          content.downloadedImages.push(imagesUrl)
          console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imagesUrl}`)
        break
        } catch(error) {
            console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar a imagem ${imagesUrl}: ${error}`)
          }
        }
      }
    }
    async function downloadAndSave(url, fileName){
      return imageDownloader.image({
        url, url,
        dest: `./content/${fileName}`
      })
    }
}

module.exports = robot