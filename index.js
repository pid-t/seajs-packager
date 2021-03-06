var path = require('path');
var grunt = require('spm-grunt');
var getConfig = require('./lib/config').getConfig;
var initDefaultConfig = require('./lib/config').initDefaultConfig;

exports = module.exports = function (options) {
  var dirname = options.args[0] || '';

  grunt.task.options(
      {
        'done': function () {
          grunt.log.writeln('success build finished.');
        }
      }
  );

  grunt.invokeTask('seajs-packager', options, function (grunt) {
    try {
      var config = getConfig(dirname, options);
      grunt.initConfig(config);
      loadTasks(grunt);

      var taskList = [
        'clean:dist', // delete dist direcotry first
        'transport:spm',  // src/* -> .build/src/*
        'concat:relative',  // .build/src/* -> .build/dist/*.js
        'concat:all',
        'uglify:js',  // .build/dist/*.js -> .build/dist/*.js
        'md5:js', // .build/dist/*.js -> dist/*-md5.js
        'clean:spm',
        'spm-newline',
        'modify-config'
      ];
      grunt.registerInitTask('seajs-packager', taskList);
    } catch (e) {
      grunt.log.error(e);
    }
  });
};

function loadTasks(grunt) {
  // load built-in tasks
  [
    'grunt-cmd-transport',
    'grunt-cmd-concat',
    'grunt-contrib-uglify',
    'grunt-contrib-copy',
    'grunt-contrib-cssmin',
    'grunt-contrib-clean',
    'grunt-md5'
  ].forEach(function (task) {
        var taskdir = path.join(__dirname, 'node_modules', task, 'tasks');
        if (grunt.file.exists(taskdir)) {
          grunt.loadTasks(taskdir);
        }
      });

  grunt.loadTasks(path.join(__dirname, 'tasks'));
}

exports.loadTasks = loadTasks;
exports.getConfig = getConfig;
exports.initDefaultConfig = initDefaultConfig;
