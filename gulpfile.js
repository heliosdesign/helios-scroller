var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    fs = require('fs');

//var content = fs.readFileSync('source/helios-frame-runner.js', 'utf8');

gulp.task('build', function(){
    return gulp.src(['source/helios-scroller.js'])
        //.pipe(replace('%%% REPLACE %%%', content))
        .pipe(rename({ basename: 'helios-scroller' }))
        .pipe(gulp.dest('.'))
        .pipe(uglify({ mangle: false }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('.'))
});

gulp.task('watch',function(){

    gulp.watch('source/helios-scroller.js', ['build']);

});