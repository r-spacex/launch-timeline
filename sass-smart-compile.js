#!/usr/bin/env node

const fs = require('fs');
const eol = require('os').EOL;
const { exec } = require('child_process');

let path;

if (process.argv.length == 2) {
  path = './css/scss/';
} else if (process.argv.length == 3) {
  path = process.argv[2];
} else {
  console.log('Usage: smartsass [path]');
  console.log('path - Path to directory where Sass files are stored');
  process.exit();
}


fs.readdir(path, (err, files) => {
  if (err) throw err;
  let fileList = [];
  files.forEach((filename) => {
    if (!filename.startsWith("_")) fileList.push(filename);
  });

  getAllConfigs(fileList, (configs) => {
    configs.forEach((config) => {
      exec(`sass ${config.target} ${config.compileDest}`, (err, stdout, stderr) => {
        if(err) throw err;
        console.log(`Compiling sass: ${config.target} => ${config.compileDest}`);
      });
    });
  });

});

/**
 * Reads a configuration from the header of a CSS file.
 * @param {string} filepath The path to the file to be read from.
 * @param {configCallback} callback - The callback that handles the read configuration.
 */
function readConfig(filepath, callback) {
  fs.readFile(filepath, (err, data) => {
    if (err) { callback(err, null); return; }

    // Read first line
    let firstLine = data.toString().split(eol)[0];
    if (firstLine.startsWith('/*') && firstLine.endsWith('*/')) {
      // First line is a comment

      let configString = firstLine.slice(2, -2).trim(); // Slice out comment markers
      let configItems = configString.split(','); // Split into array of items, denotated by commas

      let config = {};
      config.target = filepath;
      configItems.forEach((item) => {
        let pair = item.trim().split('=');
        if (pair.length == 2) {
          let key = pair[0].trim();
          let value = pair[1].trim();
          if (!isNaN(value)) {
            config[key] = Number(value);
          } else {
            config[key] = value;
          }
        }
      });
      callback(null, config);
      return;
    }
    callback(new Error('First line is not a block-style comment'), null);
    return;
  });
}

/**
 * Takes a list of files and compiles them
 * @param {string[]} files The list of file names to compile
 * @returns {object[]} An array of all the configurations for each file.
 */
function getAllConfigs(files, callback) {
  let configs = [];
  files.forEach((filename, index) => {
    readConfig(path + filename, (err, config) => {
      if (err) throw err;
      configs.push(config);
      if (index == files.length - 1) { callback(configs); return; }
    });
  });
}

/**
 * @callback configCallback
 * @param {Error} err - The error thrown, if any.
 * @param {object} config - The config object if read succesfully
 */
