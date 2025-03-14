import path from 'path'
import sharp from 'sharp'
import { parentPort, workerData } from 'worker_threads'

sharp.cache(false)

const processImage = async (file, { filename, outputFormat = 'webp', quality, maxWidth }) => {
  const validFormats = ['jpg', 'png', 'webp']
  let extension = outputFormat?.toLowerCase()

  if (!validFormats.includes(extension)) {
    extension = 'webp'
  }

  const normalizedFormat = extension === 'jpg' ? 'jpeg' : extension
  const saveName = path.parse(filename).name + `.${extension}`

  // 格式特定参数处理
  const options = { width: maxWidth, fit: 'inside', withoutEnlargement: true }
  const formatOptions = {}
  if (normalizedFormat === 'png') {
    // 将质量参数转换为压缩等级 (0-9)
    formatOptions.compressionLevel = Math.round((quality / 100) * 9)
  } else {
    formatOptions.quality = quality
    if(normalizedFormat === 'webp') {
      options.width > 16383 && (options.width = 16383)
      options.height = 16383
    }
  }

  const buffer = await sharp(file).resize(options).toFormat(normalizedFormat, formatOptions).toBuffer()

  return { buffer, filename: saveName }
}

async function compressImage() {
  try {
    const data = await processImage(workerData.file, workerData.options)
    parentPort.postMessage(data)
  } catch (err) {
    console.log('sharp compressImage error', workerData.options?.filename, err.message)
    parentPort.postMessage({ filename: workerData.options?.filename })
  }
}

compressImage()
