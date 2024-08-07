const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const AdmZip = require('adm-zip')
const unrar = require('node-unrar-js')

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

// 获取用户输入，并处理空输入的情况
const getInput = async (question, defaultValue) => {
    return new Promise(resolve => {
        readline.question(question, answer => {
            resolve(answer.trim() || defaultValue)
        })
    })
}

// 解压文件到指定目录，处理不同类型的压缩文件
const unzip = async (inputPath, tempDir) => {
    // 检查文件类型
    if (inputPath.endsWith('.rar')) {
        const extractor = await unrar.createExtractorFromFile({
            filepath: inputPath,
            targetPath: tempDir,
            filenameTransform: filename => path.basename(filename)
        })
        await extractor.extract({})
    } else {
        // 解压缩压缩包到临时文件夹
        const zip = new AdmZip(inputPath)
        zip.extractAllTo(tempDir, true)
    }
}

// 创建目录，如果不存在
const mkdir = dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

// 处理压缩包
const processZipFile = async (inputPath, outputPath, completedPath, maxWidth) => {
    // 创建临时文件夹
    const outputZip = new AdmZip()
    const tempDir = path.join(__dirname, 'temp')
    mkdir(tempDir)

    console.log('start', path.basename(inputPath))
    console.time('time')
    await unzip(inputPath, tempDir)

    // 处理图片
    const imageFiles = fs.readdirSync(tempDir).filter(file => ['.png', '.jpg'].includes(path.extname(file).toLowerCase()))

    for (const imageFile of imageFiles) {
        const imagePath = path.join(tempDir, imageFile)
        try {
            // 裁剪图片
            const buffer = await sharp(imagePath).resize(maxWidth, null, { fit: 'inside' }).webp({ quality: 89 }).toBuffer()
            // await fs.promises.writeFile(imagePath, buffer);
            outputZip.addFile(imageFile, buffer, 'some thing')
            console.time('time', `已裁剪 ${imageFile}`);
        } catch (error) {
            console.error(`裁剪 ${imageFile} 失败: ${error}`)
        }
    }

    // 所有文件添加完成后，写入压缩包
    outputZip.writeZip(outputPath)

    // 删除临时文件夹
    fs.rmSync(tempDir, { recursive: true }) // 使用 fs.rmSync 代替 fs.rmdirSync

    // 移动已完成文件
    fs.renameSync(inputPath, completedPath)

    console.timeEnd('time')
}

// 主函数
const main = async () => {
    const inputDir = await getInput('输入文件夹路径：', './input')
    const outputDir = await getInput('输出文件夹路径：', './output')
    const completedDir = await getInput('完成文件夹路径：', './completed')
    const maxWidth = parseInt(await getInput('请输入最大宽度：', '1500'))

    // 获取输入文件夹中的所有压缩包
    const zipFiles = fs.readdirSync(inputDir).filter(file => ['.zip', '.rar'].includes(path.extname(file).toLowerCase()))

    // 创建导出文件夹
    mkdir(outputDir)
    mkdir(completedDir)
    console.log(`outputDir: ${outputDir}, completedDir: ${completedDir}`)

    // 遍历每个压缩包
    for (const zipFile of zipFiles) {
        const filename = zipFile.replace('rar', 'zip')
        const inputPath = path.join(inputDir, zipFile)
        const outputPath = path.join(outputDir, filename)
        const completedPath = path.join(completedDir, filename)

        await processZipFile(inputPath, outputPath, completedPath, maxWidth)
    }

    readline.close()
}

main()
