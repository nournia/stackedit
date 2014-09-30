define([], function() {

    var markdownSectionParser = {extensionId: "markdownSectionParser"};

    var eventMgr;
    markdownSectionParser.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    // Regexp to look for section delimiters
    var regexp = '^.+[ \\t]*\\n=+[ \\t]*\\n+|^.+[ \\t]*\\n-+[ \\t]*\\n+|^\\#{1,6}[ \\t]*.+?[ \\t]*\\#*\\n+'; // Title delimiters
    regexp = '^```.*\\n[\\s\\S]*?\\n```|' + regexp; // Fenced block delimiters
    regexp = new RegExp(regexp, 'gm');

    var sectionList = [];
    var sectionCounter = 0;
    function parseFileContent(content) {
        var text = content;
        var tmpText = text + "\n\n";
        function addSection(startOffset, endOffset) {
            var sectionText = tmpText.substring(offset, endOffset);
            sectionList.push({
                id: ++sectionCounter,
                text: sectionText,
                textWithFrontMatter: sectionText
            });
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

    markdownSectionParser.onContentChanged = parseFileContent;

    return markdownSectionParser;
});
