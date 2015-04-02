'use strict';

var cv = require('opencv');
var path = require('path');
var async = require('neo-async');

// face profiles to use
var faceProfiles = [
    cv.FACE_CASCADE,
    path.resolve(__dirname, '../../node_modules/opencv/data', 'haarcascade_profileface.xml'),
    path.resolve(__dirname, '../../node_modules/opencv/data', 'haarcascade_frontalface_alt_tree.xml'),
    path.resolve(__dirname, '../../node_modules/opencv/data', 'haarcascade_mcs_eyepair_small.xml'),
    path.resolve(__dirname, '../../node_modules/opencv/data', 'haarcascade_mcs_nose.xml')
];
var faceProfilesLength = faceProfiles.length;

/**
 * Accepts image buffer and detects image face
 * @param {Buffer}   imageBuffer
 * @param {Object}   options       - { faceProfiles: Array, size: Boolean }
 * @param {Function} next          - < err, { hasFace, face: { x, y, width, height } } >
 */
function detectFace(imageBuffer, options, next) {

    // determine profiles to use
    var profilesLength;
    var profiles = options.faceProfiles;
    if (profiles) {
        profilesLength = profiles.length;
    } else {
        profiles = faceProfiles;
        profilesLength = faceProfilesLength;
    }

    cv.readImage(imageBuffer, function opencvMatrix(err, matrix) {
        if (err) {
            return next(err);
        }

        var output = {
            hasFace: false
        };

        if (options.size) {
            var size = matrix.size();
            output.height = size[0];
            output.width = size[1];
        }

        // FIXME: internall lib converts to 1 grayscale challel, but
        // crashes when we pass single channeled image for some reason
        // needs to be updated
        if (matrix.channels() === 1) {
            return setImmediate(next, null, output);
        }

        var cursor = 0;
        var faces;

        async.doUntil(
            function checkFace(callback) {

                matrix.detectObject(profiles[cursor], {}, function (err, foundFaces) {
                    if (err) {
                        return callback(err);
                    }

                    if (foundFaces && foundFaces.length > 0) {
                        faces = foundFaces;
                    }

                    callback();
                });
            },

            function test() {
                return faces || ++cursor < profilesLength;
            },

            function completed(err) {
                if (err) {
                    return setImmediate(next, err);
                }

                if (!faces || faces.length === 0) {
                    return setImmediate(next, null, output);
                }

                output.hasFace = true;
                output.face = faces[0];

                return setImmediate(next, null, output);
            }
        );
    });

}

// Public API
module.exports = detectFace;
