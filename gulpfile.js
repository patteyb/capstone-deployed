"use strict";

var   gulp  = require('gulp'),
       csso = require('gulp-csso'),
     rename = require('gulp-rename'),
     concat = require('gulp-concat'),
  imagemin  = require('gulp-imagemin'),
     uglify = require('gulp-uglify'),
     eslint = require('gulp-eslint'),
       maps = require('gulp-sourcemaps'),
     useref = require('gulp-useref'),
        iff = require('gulp-if');

var paths = {
       appScripts: 'app/**/*.js',
       vendorScripts: ['public/vendor/angular.min.js', 'public/vendor/*.min.js'],
       html: 'index.html',
       images: 'public/images/**/*',
       fonts: 'public/fonts/**',
       css: 'public/styles/style.css',
       vendorCSS: 'public/styles/*.min.css',
       templates: 'public/templates/*.html'
     };

     var dist = {
       base: 'dist',
       styles: './dist/styles',
       scripts: './dist/scripts',
       icons: './dist/icons',
       images: './dist/images',
       templates: './dist/templates'
     };


/** STYLE MANIPULATION ------------------  */
/** Minify custom styles and store in final destination */
gulp.task('customStyles', function() {
    return gulp.src(paths.css)                     
      .pipe(csso())
      .pipe(rename('custom.min.css'))
      .pipe(gulp.dest(dist.styles));
});

/** Concatenate vendor styles and store in final destination */
gulp.task('vendorStyles', function() {
    return gulp.src(paths.vendorCSS)                     
      .pipe(concat('vendor.min.css'))
      .pipe(gulp.dest(dist.styles));
});

gulp.task('styles', ['customStyles', 'vendorStyles']);


/** SCRIPT MANIPULATION ---------------  */
/** Error checking js files */
gulp.task('lint', function() {
  return gulp.src(['**/*.js', '!node_modules/**', '!public/vendor/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

/** Combine client js files and make sourcemaps */
gulp.task('concatAppScripts', function() {
  return gulp.src(paths.appScripts)
      .pipe(maps.init())
      .pipe(concat('global.js'))
      .pipe(maps.write('./'))
      .pipe(gulp.dest(dist.scripts));
});

/** Combine client js files and minify them  */
gulp.task('minifyScripts', function() {
  return gulp.src('js/global.js')
      .pipe(uglify())
      .pipe(gulp.dest(dist.scripts));
});

gulp.task('concatVendorScripts', function() {
  return gulp.src(paths.vendorScripts)
      .pipe(concat('vendor.min.js'))
      .pipe(gulp.dest(dist.scripts));
});


gulp.task('jsBuild', function () {
  //var assets = useref.assets({searchPath: ['app', 'public']});
  return gulp.src('public/index.html')
    .pipe(useref({searchPath: ['public', 'app']}))
    //.pipe(iff('*.js', uglify()))
    .pipe(gulp.dest(dist.scripts));
});

/** FILE MANIPULATION AND IMAGE OPTIMIZATION -------------------  */
/** Optimize images and output them in dist */
gulp.task('images', function() {
  return gulp.src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest(dist.images));
});

gulp.task('moveFontFiles', function() {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest('dist/scripts/fonts'));
});

gulp.task('moveTemplates', function() {
  return gulp.src(paths.templates)
    .pipe(gulp.dest(dist.templates));
});

gulp.task('moveFiles', ['images', 'moveFontFiles', 'moveTemplates']);
