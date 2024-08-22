const path = require('path')
const sharp = require('sharp')

sharp.cache(false)

const processImage = async (file, { filename, outputFormat = 'webp', quality, maxWidth }) => {
  const validFormats = ['jpg', 'png', 'webp']
  const options = { fit: 'inside', withoutEnlargement: true }
  let format = outputFormat?.toLowerCase()

  if (!validFormats.includes(format)) {
    format = 'webp'
  }

  const extension = `.${format}`
  const saveName = path.parse(filename).name + extension
  const transformer = sharp(file).resize(maxWidth, null, options)

  let buffer
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

}

const { parentPort, workerData } = require('worker_threads')

async function compressImage() {
  try {
    const data = await processImage(workerData.file, workerData.options)
    parentPort.postMessage(data)
  } catch (err) {
    console.log('sharp compressImage error', err.message)
    parentPort.postMessage(err.message)
  }
}

compressImage()
