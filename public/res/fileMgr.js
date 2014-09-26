define([
	"core",
	"eventMgr",
	"classes/FileDescriptor"
], function(core, eventMgr, FileDescriptor) {

	var fileMgr = {};

	// Defines the current file
	fileMgr.currentFile = undefined;

	eventMgr.addListener("onReady", function() {
		fileDesc = new FileDescriptor('', '');
		fileMgr.currentFile = fileDesc;

		// Notify extensions
		eventMgr.onFileSelected(fileDesc);

		// Refresh the editor (even if it's the same file)
		core.initEditor(fileDesc);
	});

	return fileMgr;
});
