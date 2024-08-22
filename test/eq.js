const { prompt } = require('enquirer');
const os = require('os');

// Calculate default threads outside the main function for clarity
const maxThreads = os.cpus().length;
const defaultThreads = Math.ceil(maxThreads * 0.9);

// Main function
const main = async () => {
  const responses = await prompt([
    {
      type: 'input',
      name: 'inputDir',
      message: 'Enter the input folder path',
      initial: './input',
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Enter the output folder path',
      initial: './output',
    },
    {
      type: 'input',
      name: 'completedDir',
      message: 'Enter the completed folder path',
      initial: './completed',
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
      name: 'threads',
      message: `Enter the number of CPU threads to use (1-${maxThreads}):`,
      initial: defaultThreads.toString(), // Convert to string for consistent input type
      validate: (value) => {
        const threads = parseInt(value, 10);
        if (isNaN(threads) || threads < 1 || threads > maxThreads) {
          return `Invalid input. Please enter a number between 1 and ${maxThreads}.`;
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'maxWidth',
      message: 'Enter the maximum image width',
      initial: '1200',
      validate: (value) => {
        const width = parseInt(value, 10);
        if (isNaN(width) || width < 50) {
          return 'Invalid input. Please enter a number greater than or equal to 50.';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'quality',
      message: 'Enter the output image quality (30-100)',
      initial: '70',
      validate: (value) => {
        const quality = parseInt(value, 10);
        if (isNaN(quality) || quality < 30 || quality > 100) {
          return 'Invalid input. Please enter a number between 30 and 100.';
        }
        return true;
      },
    },
  ]);

  // Convert string inputs to numbers after validation
  responses.threads = parseInt(responses.threads, 10);
  responses.maxWidth = parseInt(responses.maxWidth, 10);
  responses.quality = parseInt(responses.quality, 10);

  console.log(responses);
};

main();
