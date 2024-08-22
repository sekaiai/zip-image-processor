const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const prettyHrtime = require('pretty-hrtime')
const { parentPort, workerData } = require('worker_threads')
const async = require('async')
const { Worker } = require('worker_threads')

const imageFormats = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg']

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
    // 创建临时文件夹
    const zip = new AdmZip(inputPath)
    const outzip = new AdmZip()

    const basename = path.parse(inputPath).name
    const timeStart = process.hrtime()

    // 遍历所有文件条目
    const zipEntries = zip.getEntries()
    const options = { maxWidth, outputFormat, quality }
    await async.mapLimit(zipEntries, sharpThreads, createWorker.bind({ outzip, options }))

    // 所有文件添加完成后，写入压缩包
    if (outzip.getEntryCount()) {
      await outzip.writeZipPromise(outputPath)
    }

    // 移动已完成文件
    fs.renameSync(inputPath, completedPath)

    const elapsed = prettyHrtime(process.hrtime(timeStart))
    const arr = [...elapsed.replace(/\s+/, '').split(''), ...Array(20).fill(' ')].slice(0, 9).join('')
    console.log(`${arr}${basename}`)
  } catch (error) {
    console.log('error', error)
  }
}

async function createWorker(entry) {
  return new Promise(resolve => {
    if (!imageFormats.includes(path.extname(entry.entryName).toLowerCase())) {
      return resolve()
    }

    // 创建一个新的 Worker 线程
    const worker = new Worker('./worker-sharp.js', {
      workerData: { file: entry.getData(), options: { filename: entry.entryName, ...this.options } }
    })

    // 监听 Worker 线程的消息
    worker.on('message', message => {
      this.outzip.addFile(message.filename, message.buffer)
      resolve()
    })

    // 等待 Worker 线程结束
    // worker.on('exit', (exitCode) => {
    //   console.log('Worker 线程退出:', exitCode);
    // });
  })
}

async function compressImage() {
  await processZipFile(workerData)
  parentPort.postMessage()
}

compressImage()
