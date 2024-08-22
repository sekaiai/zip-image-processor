const path = require('path')
const sharp = require('sharp')

sharp.cache(false)

const processImage = async (file, { filename, outputFormat = 'webp', quality, maxWidth }) => {
  try {
    const validFormats = ['jpg', 'png', 'webp']
    const options = { fit: 'inside', withoutEnlargement: true }
    let format = outputFormat?.toLowerCase()

    if (!validFormats.includes(format)) {
      format = 'webp'
    }

    let buffer
    const extension = `.${format}`
    const saveName = path.parse(filename).name + extension
    const transformer = sharp(file).resize(maxWidth, null, options)

    switch (format) {
      case 'jpg':
        buffer = await transformer.jpeg({ quality }).toBuffer()
        break
      case 'png':
        buffer = await transformer.png({ quality }).toBuffer()
        break
      default:
        buffer = await transformer.webp({ quality }).toBuffer()
    }

    return { buffer, filename: saveName }
  } catch (err) {
    console.error('ERR:', err.message)
    return {}
  }
}

const { parentPort, workerData } = require('worker_threads')

async function compressImage() {
  try {
    const data = await processImage(workerData.file, workerData.options)
    parentPort.postMessage(data)
  } catch (error) {
    console.log('sharp compressImage error', error.message)
    parentPort.postMessage()
  }
}

compressImage()
