var handlebars = require('handlebars');
var _ = require('lodash');

/*global module:false*/
module.exports = function(grunt) {

  var version;

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    exec: {
      composer_selfupdate: {
        cmd: 'composer selfupdate',
        stdout: false,
        stderr: false
      },
      clone_composer: {
        cmd: 'git clone https://github.com/composer/composer --depth=1 --no-single-branch -q'
      },
      get_latest_version: {
        cmd: 'curl https://getcomposer.org/version',
        callback: function(err, stdout, stderr) {
          if(stderr.length > 0) {
            grunt.fail.fatal('Get composer newest version fault!');
          }

          version = stdout.toString().trim();
          console.log('latest version: ', version);
        }
      },
      export_composer_version: {
        cmd: function() {
          var template = '{{#versions}}git archive --format=tar --prefix=composer-{{this}}/ {{this}} | tar xf - && {{/versions}}';
          var cmd;
          var versions = [version];

          template = handlebars.compile(template);
          cmd = template({versions: versions}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'composer'
      },
      composer_install: {
        cmd: function(){
          var cwd = process.cwd();
          var template = '{{#versions}}(cd {{../cwd}}/composer/composer-{{this}} &&' +
            'composer install) && {{/versions}}';
          var cmd;
          var versions = [version];

          template = handlebars.compile(template);
          cmd = template({versions: versions, cwd: cwd}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'composer'
      },
      build: {
      	cmd: function(){
      		return 'php compile && echo "' + version + '" > version';
      	},
      	cwd: 'composer/bin'
      }
      
    },
    clean: ['composer'],
    
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /getcomposer.org/ig,
              replacement: 'www.phpcomposer.com'
            },
            {
              match: /\(extension_loaded\('openssl'\) \? 'https' : 'http'\)/ig,
              replacement: '\'http\''
            }
          ]
        },
        files: [
          {expand: true, cwd: 'composer', src: ['composer-*/src/Composer/Command/SelfUpdateCommand.php'], dest: 'compooser'}
        ]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-replace');

  // Default task.
  grunt.registerTask('default', [
    'clean', 
    'exec:composer_selfupdate',
    'exec:clone_composer', 
    'exec:get_latest_version', 
    'exec:export_composer_version', 
    'exec:composer_install',

    'replace',

    'exec:build'
  ]);

};
