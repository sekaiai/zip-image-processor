const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const AdmZip = require('adm-zip');
const unrar = require('node-unrar-js');
// const unrar = require('unrar');
// const unrar = require('unrar-promise')

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

// 获取用户输入
const getInput = async (question, defaultValue) => {
    return new Promise((resolve) => {
        readline.question(question, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
};

// 解压文件到指定目录
const unzip = async (inputPath, tempDir) => {
    // 检查文件类型
    if (inputPath.endsWith('.rar')) {


        const extractor = await unrar.createExtractorFromFile({
            filepath: inputPath,
            targetPath: tempDir,
            filenameTransform: (filename) => path.basename(filename)
        });

        [...extractor.extract({}).files]

    } else {
        // 解压缩压缩包到临时文件夹
        const zip = new AdmZip(inputPath);

        zip.extractAllTo(tempDir, true);
        console.log('文件已成功添加到压缩包');
    }
}

const mkdir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

// 处理压缩包
const processZipFile = async (inputPath, outputPath, completedPath, maxWidth) => {
    // 创建临时文件夹
    const tempDir = path.join(__dirname, 'temp');
    mkdir(tempDir)


    await unzip(inputPath, tempDir)
    // 处理图片
    const imageFiles = fs
        .readdirSync(tempDir)
        .filter((file) => path.extname(file).toLowerCase() === '.png' || path.extname(file).toLowerCase() === '.jpg');

    for (const imageFile of imageFiles) {
        const imagePath = path.join(tempDir, imageFile);
        // console.log({ imagePath });
        try {
            // 裁剪图片
            const buffer = await sharp(imagePath)
                .resize(maxWidth, null, { fit: 'inside' })
                .jpeg({ quality: 90 })
                .toBuffer();
            await fs.promises.writeFile(imagePath, buffer); // 将 Buffer 对象写入原文件路径
            console.log(`已裁剪 ${imageFile} 至最大宽度 ${maxWidth}`);
        } catch (error) {
            console.error(`裁剪 ${imageFile} 失败: ${error}`);
        }
    }

    // 创建新的压缩包
    const outputZip = new AdmZip();
    fs.readdirSync(tempDir).forEach((file) => {
        outputZip.addLocalFile(path.join(tempDir, file))
    });

    outputZip.writeZip(outputPath);
    // 删除临时文件夹
    fs.rmSync(tempDir, { recursive: true }); // 使用 fs.rmSync 代替 fs.rmdirSync
    // 移动以完成文件
    fs.rename(inputPath, completedPath)
};

// 主函数
const main = async () => {
    const inputDir = await getInput('请输入输入文件夹路径：', './input');
    const outputDir = await getInput('请输入输出文件夹路径：', './output');
    const completedDir = await getInput('请输入输出文件夹路径：', './completed');
    const maxWidth = parseInt(await getInput('请输入最大宽度：', '1300'));

    // 获取输入文件夹中的所有压缩包
    const zipFiles = fs.readdirSync(inputDir).filter((file) => path.extname(file).toLowerCase() === '.zip' || path.extname(file).toLowerCase() === '.rar');

    // 创建导出文件夹
    mkdir(outputDir)
    console.log(`outputDir: ${outputDir}`);

    // 遍历每个压缩包
    for (const zipFile of zipFiles) {
        const filename = zipFile.replace('rar', 'zip')
        const inputPath = path.join(inputDir, zipFile);
        const outputPath = path.join(outputDir, filename);
        const completedPath = path.join(outputDir, filename);


        await processZipFile(inputPath, outputPath, completedPath, maxWidth);
    }

    readline.close();
};

main();
