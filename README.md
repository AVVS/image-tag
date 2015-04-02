# Image tag

Outputs perceptual hash and face objects that are present on the image;
Requires phash, cimg, imagemagick and opencv to be installed.
It must be noted that due to the limitation of phash, which only accepts
file paths, we must have access to some folder, where we can write tmp files.
By default module uses `os.tmp() + '/image-tag-' + pkg.version` directory to store files,
and cleans them up after they had been processed. If you want to speed up processing and only
pay the price of copying memory (which is, of course, still not ideal) - create ramdisk and use it

`npm install image-tag -S`

## Installing

TODO: list libraries needed to install

## Usage

Accepts image buffer and outputs tagged image:

```js
var ImageTag = require('image-tag');
var imageTag = new ImageTag({
    tmpDir: '/path/to/ramdisk',
    faceProfiles: false, // you can pass paths to custom xml haar cascades, that will be used to detect faces. In fact you can detect smth other than a face here
    phash: true, // determines whether we need to calculate phash
    phashBinary: true, // should we calculat it?
    face: true // determines whether we need to detect face
});

// works only with png and jp(e)g images, so if you need to do this with other formats
// please convert your image beforehand
imageTag.detect(imageBuffer, function (err, data) {
    if (err) throw err;

    // data contains:
    {
        // only if hasFace eq true
        face: {
            x: Number,
            y: Number,
            width: Number,
            height: Number
        },
        hasFace: Boolean,
        phash: String, // 72-byte hex string
        phashBinary: [Number] // array of numbers, contains position of each 1 in the binary format of phash hex string
    }

});

```
