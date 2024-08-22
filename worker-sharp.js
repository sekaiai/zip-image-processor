const path = require('path')
const sharp = require('sharp')

sharp.cache(false);

const processImage = async (imagePath, imageTmpPath, { outputFormat = 'webp', quality, maxWidth }) => {
  try {


    const validFormats = ['jpg', 'png', 'webp'];
    const options = { fit: 'inside', withoutEnlargement: true };
    let format = outputFormat?.toLowerCase();

    if (!validFormats.includes(format)) {
      format = 'webp';
    }

    let buffer;
    const extension = `.${format}`;
    const filename = path.parse(imagePath).name + extension;
    const transformer = sharp(imagePath).resize(maxWidth, null, options);

    switch (format) {
      case 'jpg':
        buffer = await transformer.jpeg({ quality }).toFile(imageTmpPath);
        break;
      case 'png':
        buffer = await transformer.png({ quality }).toFile(imageTmpPath);
        break;
      default:
        buffer = await transformer.webp({ quality }).toFile(imageTmpPath);
    }

    // return { buffer, filename };
  } catch (err) {
    console.error('ERR:', err.message)
    return {};
  }
};

module.exports = async function ({ imagePath, imageTmpPath, options }) {
  return processImage(imagePath, imageTmpPath, options)
}