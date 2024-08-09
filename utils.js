const fs = require('fs')

// 创建目录，如果不存在
const mkdir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

module.exports = { mkdir }