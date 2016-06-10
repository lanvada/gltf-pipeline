'use strict';
var addDefaults = require('./addDefaults');
var removeUnused = require('./removeUnused');
var convertDagToTree = require('./convertDagToTree');
var combineMeshes = require('./combineMeshes');
var combinePrimitives = require('./combinePrimitives');
var removeUnusedVertices = require('./removeUnusedVertices');
var OptimizationStatistics = require('./OptimizationStatistics');
var writeGltf = require('./writeGltf');
var writeBinaryGltf = require('./writeBinaryGltf');
var readGltf = require('./readGltf');
var loadGltfUris = require('./loadGltfUris');
var quantizeAttributes = require('./quantizeAttributes');
var Cesium = require('cesium');
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = {
    processJSON : processJSON,
    processFile : processFile,
    processJSONToDisk : processJSONToDisk,
    processFileToDisk : processFileToDisk
};

function processJSON(gltf, options, callback) {
    if (defined(options.resourcePath)) {
        loadGltfUris(gltf, options.resourcePath, function(err, gltf) {
            if (err) {
                throw err;
            }
            processJSONWithExtras(gltf, options, callback);
        });
    } else {
        // If a resourcePath is not passed in, assume JSON is already embedded
        processJSONWithExtras(gltf, options, callback);
    }
}

function processJSONWithExtras(gltfWithExtras, options, callback) {
    var stats = new OptimizationStatistics();

    addDefaults(gltfWithExtras, stats);

    removeUnused(gltfWithExtras, stats);
    if (options.printStats) {
        printStats(stats);
    }
    convertDagToTree(gltfWithExtras);

    removeUnusedVertices(gltfWithExtras);

    combineMeshes(gltfWithExtras);
    combinePrimitives(gltfWithExtras);

    //Run removeUnused stage again after all pipeline stages have been run to remove objects that become unused
    removeUnused(gltfWithExtras);

    if (options.quantize) {
        quantizeAttributes(gltfWithExtras);
    }

    callback(gltfWithExtras);
}

function processFile(inputPath, options, callback) {
    readGltf(inputPath, function(gltf) {
        processJSONWithExtras(gltf, options, function(gltf) {
            callback(gltf);
        });
    });
}

function writeFile(gltf, outputPath, options, callback) {
    var binary = defaultValue(options.binary, false);
    var embed = defaultValue(options.embed, true);
    var embedImage = defaultValue(options.embedImage, true);
    var createDirectory = defaultValue(options.createDirectory, true);
    if (binary) {
        writeBinaryGltf(gltf, outputPath, createDirectory, callback);
    } else {
        writeGltf(gltf, outputPath, embed, embedImage, createDirectory, callback);
    }
}

function processJSONToDisk(gltf, outputPath, options, callback) {
    processJSON(gltf, options, function(gltf) {
        writeFile(gltf, outputPath, options, callback);
    });
}

function processFileToDisk(inputPath, outputPath, options, callback) {
    processFile(inputPath, options, function(gltf) {
        writeFile(gltf, outputPath, options, callback);
    });
}

function printStats(stats) {
    process.stdout.write('Nodes removed: ' + stats.numberRemoved.nodes + '\n');
    process.stdout.write('Skins removed: ' + stats.numberRemoved.skins + '\n');
    process.stdout.write('Cameras removed: ' + stats.numberRemoved.cameras + '\n');
    process.stdout.write('Meshes removed: ' + stats.numberRemoved.meshes + '\n');
    process.stdout.write('Accessors removed: ' + stats.numberRemoved.accessors + '\n');
    process.stdout.write('Materials removed: ' + stats.numberRemoved.materials + '\n');
    process.stdout.write('BufferViews removed: ' + stats.numberRemoved.bufferViews + '\n');
    process.stdout.write('Techniques removed: ' + stats.numberRemoved.techniques + '\n');
    process.stdout.write('Textures removed: ' + stats.numberRemoved.textures + '\n');
    process.stdout.write('Buffers removed: ' + stats.numberRemoved.buffers + '\n');
    process.stdout.write('Programs removed: ' + stats.numberRemoved.programs + '\n');
    process.stdout.write('Images removed: ' + stats.numberRemoved.images + '\n');
    process.stdout.write('Samplers removed: ' + stats.numberRemoved.samplers + '\n');
    process.stdout.write('Shaders removed: ' + stats.numberRemoved.shaders + '\n');
}