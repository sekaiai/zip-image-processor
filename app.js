const fs = require('fs')
const path = require('path')
const { mkdir } = require('./utils')
const Piscina = require('piscina');

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

// 主函数
const main = async () => {
    const inputDir = await getInput('输入文件夹路径：', './input')
    const outputDir = await getInput('输出文件夹路径：', './output')
    const completedDir = await getInput('完成文件夹路径：', './completed')
    const maxWidth = parseInt(await getInput('请输入最大宽度：', '2000'))

    // 获取输入文件夹中的所有压缩包
    const zipFiles = fs.readdirSync(inputDir).filter(file => ['.zip', '.rar'].includes(path.extname(file).toLowerCase()))

    // 创建导出文件夹
    mkdir(outputDir)
    mkdir(completedDir)
    console.log(`outputDir: ${outputDir}, completedDir: ${completedDir}`)

    // 每次 10 个线程同时执行
    const piscina = new Piscina({
        filename: path.resolve(__dirname, 'worker.js'),
        maxThreads: Math.ceil(require('os').cpus().length * 0.8)
    });
    console.log(`使用线程: ${Math.ceil(require('os').cpus().length * 0.8)}, 共有：${require('os').cpus().length}`)
    console.time('执行完成')
    // 使用 Promise.all 来并行执行多个任务
    const tasks = zipFiles.map((zipFile) => {
        const filename = zipFile.replace('rar', 'zip')
        const inputPath = path.join(inputDir, zipFile)
        const outputPath = path.join(outputDir, filename)
        const completedPath = path.join(completedDir, filename)

        return piscina.run({ inputPath, outputPath, completedPath, maxWidth });
    });

    // 等待所有任务完成
    await Promise.all(tasks);
    console.timeEnd('执行完成')

    readline.close()
}

main()
