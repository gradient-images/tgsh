module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      build: {
        src: 'src/<%= pkg.name %>.coffee',
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    watch: {
      files: 'src/<%= pkg.name %>.coffee',
      tasks: ['coffee'],
      options: {
        spawn: false,
        event: 'changed'
      }
    }
  });

  // Load the plugin task plugins.
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['coffee']);

};
