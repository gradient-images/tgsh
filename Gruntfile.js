module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      build: {
        src: 'src/<%= pkg.name %>.coffee',
        dest: 'build/<%= pkg.name %>.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-coffee');

  // Default task(s).
  grunt.registerTask('default', ['coffee']);

};
