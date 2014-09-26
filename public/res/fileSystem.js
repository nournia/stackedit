define([
    "underscore",
    "utils",
    "classes/FileDescriptor"
], function(_, utils, FileDescriptor) {
    var fileSystem = {};

    // Retrieve file descriptors from localStorage
    utils.retrieveIndexArray("file.list").forEach(function(fileIndex) {
        fileSystem[fileIndex] = new FileDescriptor(fileIndex);
    });

    return fileSystem;
});
