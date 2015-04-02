'use strict';

var uuid = require('node-uuid');
var _ = require('lodash');
var phash = require('phash-image');
var fs = require('fs');
var hexToBinary = require('hex-to-binary');

/**
 * Calculate phash for imageBuffer
 * @param  {Buffer}   imageBuffer
 * @param  {Object}   options - { tmpPath, phashBinary }
 * @param  {Function} next        < err, { phash, phashBinary } >
 */
function detectPhash(imageBuffer, options, next) {

    var filename = uuid.v1();
    var absPath = options.tmpPath + '/' + filename;

    // FIXME: upgrade phash lib so that it can accept raw buffer?
    // afaik CIMG needs to be patched for that
    fs.writeFile(absPath, imageBuffer, function writtenToDisc(err) {
        if (err) {
            return setImmediate(next, err);
        }

        phash.mh(absPath, function generatedPHash(err, hashBuffer) {
            // schedule cleanup
            fs.unlink(absPath, _.noop);

            if (err) {
                return setImmediate(next, err);
            }

            var imageHash = hashBuffer.toString('hex');
            var output = { phash: imageHash };

            if (options.phashBinary) {
                var binaryPhashString = hexToBinary(imageHash);
                var phashBinary = [];
                for (var i = 0, len = binaryPhashString.length; i < len; i++) {
                    if (binaryPhashString[i] === '1') {
                        phashBinary.push(i);
                    }
                }
            }

            setImmediate(next, null, output);

        });

    });

}

// Public API
module.exports = detectPhash;
