const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const unrar = require('node-unrar-js')
const prettyHrtime = require('pretty-hrtime');
const { mkdir } = require('./utils')
const Piscina = require('piscina');

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
const processZipFile = async ({ inputPath, outputPath, completedPath, maxWidth, quality, outputFormat, sharpThreads }) => {
  // 创建临时文件夹
  const zip = new AdmZip()
  // const basename = path.basename(inputPath).slice(0, path.basename(inputPath).indexOf('.'))
  const basename = path.parse(inputPath).name;
  const tempDir = path.join(__dirname, 'temp', basename)
  mkdir(tempDir)
  mkdir(path.join(tempDir, 'tmp'))

  await unzip(inputPath, tempDir)

  const timeStart = process.hrtime();
  // 处理图片
  const imageFormats = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg'];
  const imageFiles = fs.readdirSync(tempDir).filter(file => imageFormats.includes(path.extname(file).toLowerCase()))

  // 每次 10 个线程同时执行
  const piscina = new Piscina({
    filename: path.resolve(__dirname, 'worker-sharp.js'),
    maxThreads: sharpThreads
  });

  const tasks = imageFiles.map((imageFile) => {
    const imagePath = path.join(tempDir, imageFile)
    const imageTmpPath = path.join(tempDir, 'tmp', imageFile)

    return piscina.run({ imagePath, imageTmpPath, options: { maxWidth, outputFormat, quality } });
  });


  // 等待所有任务完成
  const result = await Promise.all(tasks);

  result.forEach(({ buffer, filename }) => buffer && zip.addFile(filename, buffer));

  // 所有文件添加完成后，写入压缩包
  if (imageFiles.length) {
    zip.writeZip(outputPath)
  }


  // 等待所有任务完成
  // await Promise.all(tasks);

  // 所有文件添加完成后，写入压缩包
  // if (imageFiles.length) {
  //   zip.addLocalFolder(tempDir);
  //   await zip.writeZipPromise(outputPath);
  // }

  // 删除临时文件夹
  // fs.rmSync(tempDir, { recursive: true }) // 使用 fs.rmSync 代替 fs.rmdirSync

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