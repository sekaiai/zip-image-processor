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

const processImage = async (imagePath, { outputFormat = 'webp', quality, maxWidth }) => {
  const validFormats = ['jpg', 'png', 'webp'];
  const options = { fit: 'inside', withoutEnlargement: true };
  let format = outputFormat?.toLowerCase();

  if (!validFormats.includes(format)) {
    format = 'webp';
  }

  let buffer;
  switch (format) {
    case 'jpg':
      buffer = await sharp(imagePath).resize(maxWidth, null, options).jpeg({ quality }).toBuffer();
      break;
    case 'png':
      buffer = await sharp(imagePath).resize(maxWidth, null, options).png({ quality }).toBuffer();
      break;
    default:
      buffer = await sharp(imagePath).resize(maxWidth, null, options).webp({ quality }).toBuffer();
  }

  const extension = `.${format}`;
  const filename = path.parse(imagePath).name + extension;

  return { buffer, filename };
};

// 处理压缩包
const processZipFile = async ({ inputPath, outputPath, completedPath, maxWidth, quality, outputFormat }) => {
  // 创建临时文件夹
  const outputZip = new AdmZip()
  const basename = path.basename(inputPath).slice(0, path.basename(inputPath).indexOf('.'))
  const tempDir = path.join(__dirname, 'temp', basename)
  mkdir(tempDir)
  await unzip(inputPath, tempDir)
  sharp.cache(false);

  const timeStart = process.hrtime();
  // 处理图片
  const imageFormats = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg'];
  const imageFiles = fs.readdirSync(tempDir).filter(file => imageFormats.includes(path.extname(file).toLowerCase()))

  for (const imageFile of imageFiles) {
    const imagePath = path.join(tempDir, imageFile)
    try {
      // 裁剪图片
      // const buffer = await sharp(imagePath).resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true }).webp({ effort: 2, force: true, quality }).toBuffer()
      const { buffer, filename } = await processImage(imagePath, { maxWidth, outputFormat, quality })
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
  // fs.renameSync(inputPath, completedPath)

  const elapsed = prettyHrtime(process.hrtime(timeStart));
  const arr = [...elapsed.replace(/\s+/, '').split(''), ...Array(20).fill(' ')].slice(0, 9).join('')
  console.log(`${arr}${basename}`);
}


module.exports = async function (task) {
  await processZipFile(task)
  return task
}