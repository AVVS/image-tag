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
 * @param {Array}    customFaceProfiles - face profiles to detect
 * @param {Function} next          - < err, { hasFace, face: { x, y, width, height } } >
 */
function detectFace(imageBuffer, customFaceProfiles, next) {
    var profilesLength;

    if (customFaceProfiles) {
        profilesLength = customFaceProfiles.length;
    } else {
        customFaceProfiles = faceProfiles;
        profilesLength = faceProfilesLength;
    }

    cv.readImage(imageBuffer, function opencvMatrix(err, matrix) {
        if (err) {
            return next(err);
        }

        // FIXME: internall lib converts to 1 grayscale challel, but
        // crashes when we pass single channeled image for some reason
        // needs to be updated
        if (matrix.channels() === 1) {
            return setImmediate(next, null, false);
        }

        var cursor = 0;
        var faces;

        async.doUntil(
            function checkFace(callback) {

                matrix.detectObject(faceProfiles[cursor], {}, function (err, foundFaces) {
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
                return faces || ++cursor < faceProfilesLength;
            },

            function completed(err) {
                if (err) {
                    return setImmediate(next, err);
                }

                if (!faces || faces.length === 0) {
                    return setImmediate(next, null, false);
                }

                return setImmediate(next, null, faces[0]);
            }
        );
    });

}

// Public API
module.exports = detectFace;
