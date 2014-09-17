define([
    "underscore",
    "extensions/markdownExtra",
    "classes/Extension",
    "crel",
], function(_, markdownExtra, Extension, crel) {

    var markdownSectionParser = new Extension("markdownSectionParser", "Markdown section parser");

    var eventMgr;
    markdownSectionParser.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    var sectionList = [];
    var previewContentsElt;

    // Regexp to look for section delimiters
    var regexp = '^.+[ \\t]*\\n=+[ \\t]*\\n+|^.+[ \\t]*\\n-+[ \\t]*\\n+|^\\#{1,6}[ \\t]*.+?[ \\t]*\\#*\\n+'; // Title delimiters
    markdownSectionParser.onPagedownConfigure = function(editor) {
        if(markdownExtra.enabled) {
            if(_.some(markdownExtra.config.extensions, function(extension) {
                return extension == "fenced_code_gfm";
            })) {
                regexp = '^```.*\\n[\\s\\S]*?\\n```|' + regexp; // Fenced block delimiters
            }
        }
        regexp = new RegExp(regexp, 'gm');

        var converter = editor.getConverter();
    };

    markdownSectionParser.onReady = function() {
        previewContentsElt = document.getElementById("preview-contents");
    };

    var fileDesc;
    markdownSectionParser.onFileSelected = function(fileDescParam) {
        fileDesc = fileDescParam;
    };

    var sectionCounter = 0;
    function parseFileContent(fileDescParam, content) {
        if(fileDescParam !== fileDesc) {
            return;
        }
        var frontMatter = (fileDesc.frontMatter || {})._frontMatter || '';
        var text = content.substring(frontMatter.length);
        var tmpText = text + "\n\n";
        function addSection(startOffset, endOffset) {
            var sectionText = tmpText.substring(offset, endOffset);
            sectionList.push({
                id: ++sectionCounter,
                text: sectionText,
                textWithFrontMatter: frontMatter + sectionText
            });
            frontMatter = '';
        }
        sectionList = [];
        var offset = 0;
        // Look for delimiters
        tmpText.replace(regexp, function(match, matchOffset) {
            // Create a new section with the text preceding the delimiter
            addSection(offset, matchOffset);
            offset = matchOffset;
        });
        // Last section
        addSection(offset, text.length);
        eventMgr.onSectionsCreated(sectionList);
    }

    markdownSectionParser.onFileOpen = parseFileContent;
    markdownSectionParser.onContentChanged = parseFileContent;

    return markdownSectionParser;
});
