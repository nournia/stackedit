define([
    "underscore",
    "utils"
], function(_, utils) {

    var storage = localStorage;

    function FileDescriptor(fileIndex, title) {
        this.fileIndex = fileIndex;
        this._title = title || storage[fileIndex + ".title"];
        this._editorStart = parseInt(storage[fileIndex + ".editorEnd"]) || 0;
        this._editorEnd = parseInt(storage[fileIndex + ".editorEnd"]) || 0;
        Object.defineProperty(this, 'content', {
            get: function() {
                return storage[this.fileIndex + ".content"];
            },
            set: function(content) {
                storage[this.fileIndex + ".content"] = content;
            }
        });
        Object.defineProperty(this, 'editorStart', {
            get: function() {
                return this._editorStart;
            },
            set: function(editorStart) {
                this._editorStart = editorStart;
                storage[this.fileIndex + ".editorStart"] = editorStart;
            }
        });
        Object.defineProperty(this, 'editorEnd', {
            get: function() {
                return this._editorEnd;
            },
            set: function(editorEnd) {
                this._editorEnd = editorEnd;
                storage[this.fileIndex + ".editorEnd"] = editorEnd;
            }
        });
    }

    return FileDescriptor;
});
