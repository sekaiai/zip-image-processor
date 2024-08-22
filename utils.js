import fs from 'fs';

// 创建目录，如果不存在
export const mkdir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
