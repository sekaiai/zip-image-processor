const async = require('async');
const { Worker } = require('worker_threads');
const { promisify } = require('util');

// 最大并发子线程数量
const MAX_CONCURRENT_WORKERS = 2;

// 主线程代码
async function main() {
  const todo = [1, 2, 3, 4, 5, 6];

  async.mapLimit(todo, MAX_CONCURRENT_WORKERS, createWorker, (err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('处理结果:', results);
  });
}

// 创建子线程并返回一个包含 promise 的对象
async function createWorker(value) {

  return new Promise((resolve) => {
    // 创建一个新的 Worker 线程
    const worker = new Worker('./worker3.js', {
      workerData: value
    });

    // 监听 Worker 线程的消息
    worker.on('message', (message) => {
      console.log('压缩完成:', message);
      resolve(message)
    });

    // 等待 Worker 线程结束
    worker.on('exit', (exitCode) => {
      console.log('Worker 线程退出:', exitCode);
    });
  })

}

main();
