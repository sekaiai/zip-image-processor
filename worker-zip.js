import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import prettyHrtime from 'pretty-hrtime'
import { Worker, parentPort, workerData } from 'worker_threads'
import async from 'async'

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
    const imageFormatsSet = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg'])
    const options = { maxWidth, outputFormat, quality }
    const zipEntries = zip.getEntries().reduce((acc, entry) => {
      const ext = path.extname(entry.entryName).toLowerCase()
      if (imageFormatsSet.has(ext)) {
        acc.push({ file: entry.getData(), options: { filename: entry.entryName, ...options } })
      }
      return acc
    }, [])

    if (!zipEntries.length) {
      return
    }

    await async.eachLimit(zipEntries, sharpThreads, createWorker.bind({ outzip }))

    // 所有文件添加完成后，写入压缩包
    await outzip.writeZipPromise(outputPath)

    // 移动已完成文件
    fs.renameSync(inputPath, completedPath)

    const elapsed = prettyHrtime(process.hrtime(timeStart))
    const arr = [...elapsed.replace(/\s+/, '').split(''), ...Array(10).fill(' ')].join('').slice(0, 12)
    const total = [`${zipEntries.length}p`, ...Array(10).fill(' ')].join('').slice(0, 9)
    console.log(`${arr}${total}${basename}`)
  } catch (error) {
    console.log('Error:', error.message, inputPath)
  }
}

async function compressImage() {
  await processZipFile(workerData)
  parentPort.postMessage('完成!')
}

compressImage()

async function createWorker(workerData) {
  return new Promise(resolve => {
    // 创建一个新的 Worker 线程
    const worker = new Worker('./worker-sharp.js', { workerData })

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
