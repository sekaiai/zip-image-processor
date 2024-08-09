const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const AdmZip = require('adm-zip')
const unrar = require('node-unrar-js')
const prettyHrtime = require('pretty-hrtime');
const { mkdir } = require('./utils')
// 解压文件到指定目录，处理不同类型的压缩文件
const unzip = async (inputPath, tempDir) => {
  try {
    // 检查文件类型
    if (inputPath.endsWith('.rar')) {
      const extractor = await unrar.createExtractorFromFile({
        filepath: inputPath,
        targetPath: tempDir,
        filenameTransform: filename => path.basename(filename)
      })
      extractor.extract({})
    } else {
      // 解压缩压缩包到临时文件夹
      const zip = new AdmZip(inputPath)
      zip.extractAllTo(tempDir, true)
    }
  } catch (err) {
    console.log('ERROR:', inputPath, err.message);
  }
}

// 处理压缩包
const processZipFile = async ({ inputPath, outputPath, completedPath, maxWidth }) => {
  // 创建临时文件夹
  const outputZip = new AdmZip()
  const basename = path.basename(inputPath).slice(0, path.basename(inputPath).indexOf('.'))
  const tempDir = path.join(__dirname, 'temp', basename)
  mkdir(tempDir)
  await unzip(inputPath, tempDir)

  const timeStart = process.hrtime();
  // 处理图片
  const imageFiles = fs.readdirSync(tempDir).filter(file => ['.png', '.jpg'].includes(path.extname(file).toLowerCase()))

  for (const imageFile of imageFiles) {
    const imagePath = path.join(tempDir, imageFile)
    try {
      // 裁剪图片
      const buffer = await sharp(imagePath).resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true }).webp({ effort: 2, force: true, }).toBuffer()
      // await fs.promises.writeFile(imagePath, buffer);
      const filename = imageFile.replace(path.extname(imageFile), '.webp')
      outputZip.addFile(filename, buffer)
    } catch (error) {
      console.error(`裁剪 ${imageFile} 失败: ${error}`)
    }
  }

  // 所有文件添加完成后，写入压缩包
  if (imageFiles.length) {
    outputZip.writeZip(outputPath)
  }

  // 删除临时文件夹
  fs.rmSync(tempDir, { recursive: true }) // 使用 fs.rmSync 代替 fs.rmdirSync

  // 移动已完成文件
  fs.renameSync(inputPath, completedPath)

  const elapsed = prettyHrtime(process.hrtime(timeStart));
  const arr = [...elapsed.replace(/\s+/, '').split(''), ...Array(20).fill(' ')].slice(0, 9).join('')
  console.log(`${arr}${basename}`);
}


module.exports = async function (task) {
  await processZipFile(task)
  return task
}