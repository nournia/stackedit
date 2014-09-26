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
        this._discussionList = JSON.parse(storage[fileIndex + ".discussionList"] || '{}');
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
        Object.defineProperty(this, 'discussionList', {
            get: function() {
                return this._discussionList;
            },
            set: function(discussionList) {
                this._discussionList = discussionList;
                storage[this.fileIndex + ".discussionList"] = JSON.stringify(discussionList);
            }
        });
        Object.defineProperty(this, 'discussionListJSON', {
            get: function() {
                return storage[this.fileIndex + ".discussionList"] || '{}';
            },
            set: function(discussionList) {
                this._discussionList = JSON.parse(discussionList);
                storage[this.fileIndex + ".discussionList"] = discussionList;
            }
        });
    }

    return FileDescriptor;
});
