'use strict';

var os = require('os');
var path = require('path');
var _ = require('lodash');
var detectFace = require('./lib/face.js');
var detectPhash = require('./lib/phash.js');
var pkg = require('./package.json');
var async = require('neo-async');
var mkdirp = require('mkdirp');

/**
 * Creates ImageTag instance,
 *
 * @param {Object} options:
 *        @param {String} tmpDir - directory to save files for phash processing
 *        @param {Boolean} phash - should we calculated phash? Default: true
 *        @param {Boolean} face - should we find face positions? Default: true
 */
function ImageTag(options, done) {

    if (!this instanceof ImageTag) {
        return new ImageTag(options, done);
    }

    done = done || function imageTagInstanceCreated(err) {
        if (err) {
            throw err;
        }
    };

    var opts = this.options = _.defaults(options || {}, {
        face: true,
        size: true,
        faceProfiles: false,
        phash: true,
        phashBinary: true,
        tmpDir: path.resolve(os.tmpdir(), pkg.name, pkg.version)
    });

    if (!opts.face && !opts.phash) {
        return setImmediate(done, new Error('at `face` or `phash` must be set to true'));
    }

    if (!opts.phash) {
        return setImmediate(done);
    }

    mkdirp(opts.tmpDir, done);
}

/**
 * Detects face and phash of imageBuffer
 * @param  {Buffer}   imageBuffer   - binary data of image in jp(e)g / png format
 * @param  {Function} next          - <err, imageData>
 */
ImageTag.prototype.detect = function (imageBuffer, next) {

    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length < 1) {
        return setImmediate(next, new Error('first argument must be a non-empty buffer'));
    }

    var output = {};
    var options = this.options;

    async.parallel({

        face: function (callback) {
            if (!options.face) {
                return callback();
            }

            detectFace(imageBuffer, options, function detectFaceCallback(err, faceData) {
                if (err) {
                    return callback(err);
                }

                _.extend(output, faceData);
                callback();
            });
        },

        phash: function (callback) {
            if (!options.phash) {
                return callback();
            }

            detectPhash(imageBuffer, options.tmpDir, function detectPhashCallback(err, phashData) {
                if (err) {
                    return callback(err);
                }

                _.extend(output, phashData);
                callback();
            });
        }

    }, function detectionCallback(err) {
        if (err) {
            return setImmediate(next, err);
        }

        setImmediate(next, null, output);
    });

};

module.exports = ImageTag;
