const zip = new AdmZip('../../zip-file')
const zipEntries = zip.getEntries();

// 遍历所有文件条目
zipEntries.forEach(entry => {
  // 获取文件名称
  const entryName = entry.entryName;

  if (imageFormats.includes(path.extname(entryName).toLowerCase())) {
    const data = entry.getData()
  }

});