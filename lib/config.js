var grunt = require('spm-grunt');
var _ = grunt.util._;

var defaultConfig = {};
var src = '';

function initDefaultConfig(configFile) {
  if (!grunt.file.isFile(configFile)) {
    throw new Error('can not find the config file : ' + configFile);
  }
  var pkg = grunt.file.readJSON(configFile);
  defaultConfig = pkg.spm;
}
exports.initDefaultConfig = initDefaultConfig;

function getConfig(dirname, options) {
  // if specific the default configuration file, then load it
  if (grunt.file.exists(options.defaults) && grunt.file.isFile(options.defaults)) {
    initDefaultConfig(options.defaults);
  }
  if (!grunt.file.isFile(dirname, 'package.json')) {
    throw new Error('can not find package.json in `' + dirname + '`!');
  }

  var pkg = grunt.file.readJSON(dirname + '/package.json');

  // merge all configs
  var buildConfig = _.merge({}, defaultConfig, pkg.spm);

  src = buildConfig.src = dirname.replace(/[\/\.]/g, '');
  buildConfig.family = pkg.family || buildConfig.src;
  buildConfig.outputDir = (options.outputDirectory || 'sea-modules').replace(/\\/g, '/').replace(/\/$/g, '');
  buildConfig.dist = buildConfig.outputDir + '/' + buildConfig.family;
  buildConfig.gzip = options.gzip;
  buildConfig.alias = buildConfig.alias || {};
  grunt.config.set('defaultConf', defaultConfig);
  var data = {
    clean: {
      dist: cleanDistConfig(buildConfig),
      spm: ['.build']
    },
    transport: {
      spm: transportConfig(buildConfig)
    },
    concat: {
      relative: concatRelativeConfig(buildConfig),
      all: concatAllConfig(buildConfig)
    },
    uglify: {
      js: uglifyConfig(buildConfig)
    },
    md5: md5Config(buildConfig),
    "spm-newline": {
      target: {
        dist: buildConfig.dist
      }
    },
    "modify-config": {
      target: {
        filename: options.configFile || defaultConfig.configFile
      }
    }
  };

  if (buildConfig.gzip === 'all' || buildConfig.gzip === 'current') {
    data.compress = {
      js: gzipConfig(buildConfig)
    }
  }
  return data;
}
exports.getConfig = getConfig;

// clean:dist
function cleanDistConfig(buildConfig) {
  return [buildConfig.dist];
}

// transport:spm
function transportConfig(buildConfig) {
  var transport = require('grunt-cmd-transport');
  var script = transport.script.init(grunt);
  var style = transport.style.init(grunt);
  var text = transport.text.init(grunt);
  var template = transport.template.init(grunt);

  return {
    options: {
      idleading: buildConfig.family + '/',
      paths: [buildConfig.outputDir],
      alias: buildConfig.alias || {},
      parsers: {
        '.js': [script.jsParser ],
        '.css': [style.css2jsParser],
        '.html': [text.html2jsParser],
        '.handlebars': [template.handlebarsParser]
      },
      handlebars: {
        id: buildConfig.alias.handlebars || 'handlebars',
        knownHelpers: [],
        knownHelpersOnly: false
      },
      debug: false
    },
    files: [
      {
        cwd: buildConfig.src,
        expand: true,
        src: '**/*',
        filter: function (filepath) {
          // exclude outputDir dir
          return grunt.file.isFile(filepath) && !grunt.file.doesPathContain(buildConfig.outputDir, filepath);
        },
        dest: '.build/src'
      }
    ]
  };
}

// concat:relative
// support format
// ["main.js", {"xx.js": ["xx.js", "templates/*.html.js"]}]
function concatRelativeConfig(buildConfig) {
  var files = {};
  var outputs = getRecursivelyRelativeOutput('', buildConfig);
  outputs.forEach(function (f) {
    if (_.isString(f)) {
      files['.build/dist/' + f] = '.build/src/' + f;
    } else {
      var filename = _.keys(f)[0];
      files['.build/dist/' + filename] = f[filename].map(function (path) {
        return '.build/src/' + path;
      });
    }
  });
  return  {
    options: {
      include: 'relative'
    },
    files: files
  };
}

function getRecursivelyRelativeOutput(parent, buildConfig) {
  var subModules = buildConfig.modules || [];
  var relativeOutputs = (buildConfig.output && buildConfig.output.relative) || [];
  var idx;
  if (parent) {
    for (idx = 0; idx < relativeOutputs.length; idx++) {
      relativeOutputs[idx] = parent + '/' + relativeOutputs[idx];
    }
  }
  if (!subModules.length) {
    return relativeOutputs;
  }
  for (var i = 0, module; module = subModules[i]; i++) {
    var m = parent ? (parent + '/' + module) : module;
    relativeOutputs = relativeOutputs.concat(getRecursivelyRelativeOutput(m, getModuleConfig(src + '/' + m)));
  }
  return relativeOutputs;
}

function getModuleConfig(fullModuleName) {
  if (!grunt.file.isFile(fullModuleName, 'package.json')) {
    throw new Error('can not find package.json in `' + fullModuleName + '`!');
  }
  var pkg = grunt.file.readJSON(fullModuleName + '/package.json');
  return _.merge({}, defaultConfig, pkg.spm);
}

// concat:all
function concatAllConfig(buildConfig) {
  var files = {};
  var outputs = getRecursivelyAllOutput('', buildConfig);
  outputs.forEach(function (f) {
    files['.build/dist/' + f] = '.build/src/' + f;
  });
  return  {
    options: {
      include: 'all',
      paths: [buildConfig.outputDir]
    },
    files: files
  };
}

function getRecursivelyAllOutput(parent, buildConfig) {
  var subModules = buildConfig.modules || [];
  var allOutputs = (buildConfig.output && buildConfig.output.all) || [];
  var idx;
  if (parent) {
    for (idx = 0; idx < allOutputs.length; idx++) {
      allOutputs[idx] = parent + '/' + allOutputs[idx];
    }
  }
  if (!subModules.length) {
    return allOutputs;
  }
  for (var i = 0, module; module = subModules[i]; i++) {
    var m = parent ? (parent + '/' + module) : module;
    allOutputs = allOutputs.concat(getRecursivelyAllOutput(m, getModuleConfig(src + '/' + m)));
  }
  return allOutputs;
}

// uglify:js
function uglifyConfig(buildConfig) {
  var files = {};
  var relativeOutputs = getRecursivelyRelativeOutput('', buildConfig);
  relativeOutputs.forEach(function (f) {
    f = _.isString(f) ? f : _.keys(f)[0];
    files['.build/dist/' + f] = '.build/dist/' + f;
  });
  var allOutputs = getRecursivelyAllOutput('', buildConfig);
  allOutputs.forEach(function (f) {
    files['.build/dist/' + f] = '.build/dist/' + f;
  });
  return {
    files: files
  };
}

function md5Config(buildConfig) {
  var afterMd5 = function (fileChanges) {
    var map = [];
    fileChanges.forEach(function (obj) {
      obj.oldPath = obj.oldPath.replace('.build/dist/', '');
      obj.newPath = obj.newPath.replace(buildConfig.dist + '/', '');
      map.push([obj.oldPath, obj.newPath]);
    });
    grunt.config.set('md5map', map);
  };

  return {
    options: {
      encoding: 'utf8',
      keepBasename: true,
      keepExtension: true,
      after: afterMd5
    },
    js: {
      files: [
        {
          expand: true,     // Enable dynamic expansion.
          cwd: '.build/dist/',      // Src matches are relative to this path.
          src: ['**/*.js'], // Actual pattern(s) to match.
          dest: buildConfig.dist   // Destination path prefix.
        }
      ]
    }
  };
}

// compress
// compress all file in 'sea-modules'
function gzipConfig(buildConfig) {
  var dir = buildConfig.gzip === 'all' ? buildConfig.outputDir : buildConfig.dist;
  return {
    options: {
      mode: 'gzip'
    },
    files: [
      {
        expand: true,     // Enable dynamic expansion.
        cwd: dir,      // Src matches are relative to this path.
        src: ['**/*.js'], // Actual pattern(s) to match.
        dest: dir,  // Destination path prefix.
        filter: function (filepath) {
          return (grunt.file.isFile(filepath) && !grunt.file.exists(filepath + '.gz'));
        }
      }
    ]
  }
}