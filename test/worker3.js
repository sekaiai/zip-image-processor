const { parentPort, workerData } = require('worker_threads');

async function compressImage() {
  try {
    console.log({ workerData })
    setTimeout(() => {
      parentPort.postMessage('完成!');
    }, Math.random() * 3000);
  } catch (error) {
    parentPort.postMessage('失败:', error);
  }
}

compressImage();