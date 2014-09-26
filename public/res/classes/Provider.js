define([
    'underscore',
    'utils',
    'eventMgr',
    'editor',
    'diff_match_patch_uncompressed',
    'jsondiffpatch',
    'fileMgr'
], function(_, utils, eventMgr, editor, diff_match_patch, jsondiffpatch) {

    function Provider(providerId, providerName) {
        this.providerId = providerId;
        this.providerName = providerName;
        this.isPublishEnabled = true;
    }

    // Parse and check a JSON discussion list
    Provider.prototype.parseDiscussionList = function(discussionListJSON) {
        try {
            var discussionList = JSON.parse(discussionListJSON);
            _.each(discussionList, function(discussion, discussionIndex) {
                if(
                    (discussion.discussionIndex != discussionIndex) ||
                    (!_.isNumber(discussion.selectionStart)) ||
                    (!_.isNumber(discussion.selectionEnd))
                ) {
                    throw 'invalid';
                }
                discussion.commentList && discussion.commentList.forEach(function(comment) {
                    if(
                        (!(!comment.author || _.isString(comment.author))) ||
                        (!_.isString(comment.content))
                    ) {
                        throw 'invalid';
                    }
                });
            });
            return discussionList;
        }
        catch(e) {
        }
    };

    Provider.prototype.serializeContent = function(content, discussionList) {
        if(discussionList.length > 2) { // Serialized JSON
            return content + '<!--se_discussion_list:' + discussionList + '-->';
        }
        return content;
    };

    Provider.prototype.parseContent = function(content) {
        var discussionList;
        var discussionListJSON = '{}';
        var discussionExtractor = /<!--se_discussion_list:([\s\S]+)-->$/.exec(content);
        if(discussionExtractor && (discussionList = this.parseDiscussionList(discussionExtractor[1]))) {
            content = content.substring(0, discussionExtractor.index);
            discussionListJSON = discussionExtractor[1];
        }
        return {
            content: content,
            discussionList: discussionList || {},
            discussionListJSON: discussionListJSON
        };
    };

    var diffMatchPatch = new diff_match_patch();
    diffMatchPatch.Match_Threshold = 0;
    diffMatchPatch.Patch_DeleteThreshold = 0;
    var jsonDiffPatch = jsondiffpatch.create({
        objectHash: function(obj) {
            return JSON.stringify(obj);
        },
        textDiff: {
            minLength: 9999999
        }
    });

    return Provider;
});
