var spmGrunt = require('spm-grunt');
module.exports = function (grunt) {
  var path = require('path');
  var zlib = require('zlib');
  var fs = require('fs');

  var MAP_TPL = grunt.file.read(path.join(__dirname, 'map.tpl'));

  // add md5-map to seajs config
  grunt.registerMultiTask('modify-config', function () {
    if (!this.data.filename) {
      grunt.log.warn('Missing config file option.');
      return;
    }
    var code = '';
    if (grunt.file.exists(this.data.filename)) {
      code = grunt.file.read(this.data.filename);
    }
    code = code.replace(/\/\*map start\*\/[\s\S]*\/\*map end\*\//, '').trim();
    code = code.replace(/\/\*defaults start\*\/[\s\S]*\/\*defaults end\*\//, '').trim();
    var mapArr = spmGrunt.config.get('md5map');
    var defaultConf = spmGrunt.config.get('defaultConf');
    code = grunt.template.process(MAP_TPL, {
      data: {
        mapJSON: JSON.stringify(mapArr, null, '\t'),
        defaultsConf: JSON.stringify(defaultConf, null, '\t')}
    }) + '\n' + code;
    grunt.file.write(this.data.filename, code);
    grunt.log.writeln('File "' + this.data.filename + '" modified.');
  });

  grunt.registerMultiTask('spm-newline', function () {
    grunt.file.recurse(this.data.dist, function (f) {
      var extname = path.extname(f);
      if (extname === '.js' || extname === '.css') {
        var text = grunt.file.read(f);
        if (!/\n$/.test(text)) {
          grunt.file.write(f, text + '\n');
        }
      }
    });
  });
};