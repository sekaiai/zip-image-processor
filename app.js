const fs = require('fs')
const path = require('path')
const { mkdir } = require('./utils')
const { prompt } = require('enquirer')
const async = require('async')
const { Worker } = require('worker_threads')

const getParams = async () => {
    const maxThreads = require('os').cpus().length
    const defaultThreads = Math.ceil(maxThreads * 0.9)

    const responses = await prompt([
        {
            type: 'input',
            name: 'inputDir',
            message: 'Enter the input folder path',
            initial: './input'
        },
        {
            type: 'input',
            name: 'outputDir',
            message: 'Enter the output folder path',
            initial: './output'
        },
        {
            type: 'input',
            name: 'completedDir',
            message: 'Enter the completed folder path',
            initial: './completed'
        },
        {
            type: 'select',
            name: 'outputFormat',
            message: 'Select the output image format:',
            initial: 'webp',
            choices: ['webp', 'jpg', 'png']
        },
        {
            type: 'input',
            name: 'zipThreads',
            message: `Enter the number of CPU threads to use for zip processing (1-${maxThreads})`,
            initial: Math.round(Math.sqrt(defaultThreads)).toString(), // Convert to string for consistent input type
            validate: value => {
                const threads = parseInt(value, 10)
                if (isNaN(threads) || threads < 1) {
                    return `Invalid input. Please enter a number between 1 and ${maxThreads}.`
                }
                return true
            }
        },
        {
            type: 'input',
            name: 'sharpThreads',
            message: `Enter the number of CPU threads to use for image processing (1-${maxThreads})`,
            initial: defaultThreads.toString(), // Convert to string for consistent input type
            validate: value => {
                const threads = parseInt(value, 10)
                if (isNaN(threads) || threads < 1) {
                    return `Invalid input. Please enter a number between 1 and ${maxThreads}.`
                }
                return true
            }
        },
        {
            type: 'input',
            name: 'maxWidth',
            message: 'Enter the maximum image width',
            initial: '1200',
            validate: value => {
                const width = parseInt(value, 10)
                if (isNaN(width) || width < 50) {
                    return 'Invalid input. Please enter a number greater than or equal to 50.'
                }
                return true
            }
        },
        {
            type: 'input',
            name: 'quality',
            message: 'Enter the output image quality (30-100)',
            initial: '70',
            validate: value => {
                const quality = parseInt(value, 10)
                if (isNaN(quality) || quality < 30 || quality > 100) {
                    return 'Invalid input. Please enter a number between 30 and 100.'
                }
                return true
            }
        }
    ])

    // Convert string inputs to numbers after validation
    responses.sharpThreads = parseInt(responses.sharpThreads, 10)
    responses.zipThreads = parseInt(responses.zipThreads, 10)
    responses.maxWidth = parseInt(responses.maxWidth, 10)
    responses.quality = parseInt(responses.quality, 10)
    return responses
}

async function createWorker(value) {
    return new Promise(resolve => {
        // 创建一个新的 Worker 线程
        const worker = new Worker('./worker-zip.js', {
            workerData: value
        })

        // 监听 Worker 线程的消息
        worker.on('message', () => {
            resolve()
        })
    })
}

// 主函数
const main = async () => {
    const { inputDir, outputDir, completedDir, maxWidth, quality, zipThreads, sharpThreads, outputFormat } =
        await getParams()

    // 获取输入文件夹中的所有压缩包
    const zipFiles = fs.readdirSync(inputDir).filter(file => ['.zip', '.rar'].includes(path.extname(file).toLowerCase()))

    console.log(`\n执行中，共 ${zipFiles.length} 文件... \n`)
    // 创建导出文件夹
    mkdir(outputDir)
    mkdir(completedDir)

    console.time('执行完成')
    // 使用 Promise.all 来并行执行多个任务
    const tasks = zipFiles.map(zipFile => {
        const filename = zipFile.replace('rar', 'zip')
        const inputPath = path.join(inputDir, zipFile)
        const outputPath = path.join(outputDir, filename)
        const completedPath = path.join(completedDir, filename)

        return { inputPath, outputPath, completedPath, maxWidth, quality, outputFormat, sharpThreads }
    })

    await async.mapLimit(tasks, zipThreads, createWorker)

    // 等待所有任务完成
    await Promise.all(tasks)
    console.timeEnd('执行完成')
}

main()
