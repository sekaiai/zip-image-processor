import fs from 'fs'
import path from 'path'
import yauzl from 'yauzl'
import yazl from 'yazl'
import prettyHrtime from 'pretty-hrtime'
import { Worker, parentPort, workerData } from 'worker_threads'
import async from 'async'
import unrar from 'node-unrar-js'

const imageFormatsSet = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg'])
const ARCHIVE_TYPES = {
  ZIP: '.zip',
  RAR: '.rar'
}

// 读取ZIP文件并收集图片条目
const readZipEntries = (inputPath, options) => {
  return new Promise((resolve, reject) => {
    yauzl.open(inputPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err)
      const entries = []

      zipfile.on('entry', entry => {
        const ext = path.extname(entry.fileName).toLowerCase()
        if (imageFormatsSet.has(ext)) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err)
            const chunks = []
            readStream.on('data', chunk => chunks.push(chunk))
            readStream.on('end', () => {
              entries.push({
                file: Buffer.concat(chunks),
                options: { filename: entry.fileName, ...options }
              })
              zipfile.readEntry()
            })
            readStream.on('error', reject)
          })
        } else {
          zipfile.readEntry()
        }
      })

      zipfile.once('end', () => resolve(entries))
      zipfile.readEntry()
    })
  })
}

// 读取RAR文件条目
const readRarEntries = async (inputPath, options) => {
  const buf = Uint8Array.from(fs.readFileSync(inputPath)).buffer
  const extractor = await unrar.createExtractorFromData({ data: buf })
  const extracted = extractor.extract()
  const files = [...extracted.files]

  const entries = []
  for (let i = 0; i < files.length; i++) {
    const { extraction, fileHeader } = files[i]
    const ext = path.extname(fileHeader.name).toLowerCase()
    if (imageFormatsSet.has(ext)) {
      entries.push({
        file: extraction,
        options: { filename: fileHeader.name, ...options }
      })
    }
  }
  return entries
}

// 处理压缩包
const processZipFile = async ({
  inputPath,
  outputPath,
  completedPath,
  maxWidth,
  quality,
  outputFormat,
  sharpThreads
}) => {
  try {
    const options = { maxWidth, quality, outputFormat }
    const ext = path.extname(inputPath).toLowerCase()

    let entries
    if (ext === ARCHIVE_TYPES.ZIP) {
      entries = await readZipEntries(inputPath, options)
    } else if (ext === ARCHIVE_TYPES.RAR) {
      entries = await readRarEntries(inputPath, options)
    } else {
      throw new ArchiveError('不支持的文件格式', inputPath)
    }

    if (!entries.length) return

    const zipfile = new yazl.ZipFile()
    const basename = path.parse(inputPath).name
    const timeStart = process.hrtime()

    // 使用Worker处理并添加文件到zip
    await async.eachLimit(entries, sharpThreads, createWorker.bind({ zipfile }))

    // 写入压缩包文件
    await new Promise((resolve, reject) => {
      zipfile.outputStream.pipe(fs.createWriteStream(outputPath)).on('close', resolve).on('error', reject)
      zipfile.end()
    })

    // 移动原文件
    fs.renameSync(inputPath, completedPath)

    // 输出日志
    const elapsed = prettyHrtime(process.hrtime(timeStart))
    const arr = [...elapsed.replace(/\s+/, '').split(''), ...Array(10).fill(' ')].join('').slice(0, 12)
    const total = [`${entries.length}p`, ...Array(10).fill(' ')].join('').slice(0, 9)
    console.log(`${arr}${total}${basename}`)
  } catch (error) {
    console.log('Error:', error.message, inputPath)
  }
}

// 创建Worker处理图片
async function createWorker(workerData) {
  return new Promise(resolve => {
    const worker = new Worker('./worker-sharp.js', { workerData })
    worker.on('message', message => {
      if(message.buffer){
        this.zipfile.addBuffer(Buffer.from(message.buffer), message.filename)
      }
      resolve()
    })
    worker.on('error', err => {
      console.error('sharp Worker error:', err)
      resolve()
    })
  })
}

// Worker线程入口
async function compressImage() {
  await processZipFile(workerData)
  parentPort.postMessage('完成!')
}

compressImage()
