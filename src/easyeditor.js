'use strict';

(function($, document, window){

    function EasyEditor(options){
        this.elem = options.element;
        this.className = options.className || 'easyeditor';

        var allButtons = ['bold', 'italic', 'link', 'h2', 'h3', 'h4', 'alignleft', 'aligncenter', 'alignright', 'quote', 'code', 'image', 'youtube', 'x'];
        var defaultButtons = ['bold', 'italic', 'link', 'h2', 'h3', 'h4', 'alignleft', 'aligncenter', 'alignright'];
        this.buttons = options.buttons || defaultButtons;
        this.buttonsHtml = options.buttonsHtml || null;

        this.attachEvents();
    }

    // initialize
    EasyEditor.prototype.attachEvents = function() {
        this.bootstrap();
        this.addToolbar();
        this.handleKeypress();
        this.handleResizeImage();
        this.utils();
    };

    // Adding necessary classes and attributes in editor
    EasyEditor.prototype.bootstrap = function() {
        var _this = this;

        $(_this.elem)
            .attr('contentEditable', true)
            .addClass(_this.className)
            .wrap('<div class="'+ _this.className +'-wrapper"></div>');

        this.$wrapperElem = $(_this.elem).parent();
    };

    // enter and paste key handler
    EasyEditor.prototype.handleKeypress = function(){
        var _this = this;

        $(_this.elem).keydown(function(e) {
            if (e.keyCode === 13) {
                document.execCommand('insertHTML', false, '<br>');
                return false;
            }
        });

        document.getElementById(_this.elem.substr(1)).addEventListener('paste', function(e) {
            e.preventDefault();
            var text = e.clipboardData.getData('text/plain').replace(/\n/ig, '<br>');
            document.execCommand('insertHTML', false, text);
        });

    };

    // adding toolbar
    EasyEditor.prototype.addToolbar = function(){
        var _this = this;

        $(_this.elem).before('<div class="'+ _this.className +'-toolbar"><ul></ul></div>');
        this.$toolbarContainer = this.$wrapperElem.find('.' + _this.className +'-toolbar');

        this.populateButtons();
    };

    // inejct button events
    EasyEditor.prototype.injectButton = function(settings){
        var _this = this;

        if(_this.buttonsHtml !== null && _this.buttonsHtml[settings.buttonIdentifier] !== undefined) {
            settings.buttonHtml = _this.buttonsHtml[settings.buttonIdentifier];
        }

        if(settings.buttonHtml) {
            _this.$toolbarContainer.find('ul').append('<li><button class="toolbar-'+ settings.buttonIdentifier +'" title="'+ settings.buttonIdentifier.replace(/\W/g, ' ') +'">'+ settings.buttonHtml +'</button></li>');
        }

        if(typeof settings.clickHandler === 'function') {
            _this.$toolbarContainer.find('.toolbar-'+ settings.buttonIdentifier).click(settings.clickHandler);
        }
    };

    // bidning all buttons
    EasyEditor.prototype.populateButtons = function(){
        var _this = this;

        $.each(_this.buttons, function(index, button) {
            if(typeof _this[button] === 'function'){
                _this[button]();
            }
        });

    };

    // allowing resizing image
    EasyEditor.prototype.handleResizeImage = function(){
        var _this = this;

        $(_this.elem).delegate('figure', 'click', function(event) {
            event.stopPropagation();
            $(this).addClass('is-resizable');
        });

        $(_this.elem).delegate('figure.is-resizable', 'mousemove', function() {
            $(this).find('img').css({ 'width' : $(this).width() + 'px' });
        });

        $(document).click(function() {
            $(_this.elem).find('figure').removeClass('is-resizable');
        });
    };

    // get selection
    EasyEditor.prototype.getSelection = function(){
        if (window.getSelection) {
            var selection = window.getSelection();

            if (selection.rangeCount) {
                return selection;
            }
        }

        return false;
    };

    // remove formatting
    EasyEditor.prototype.removeFormatting = function(arg){
        var _this = this;
        var inFullArea = arg.inFullArea;

        if(_this.isSelectionOutsideOfEditor() === true) {
            return false;
        }

        if(inFullArea === false) {
            var selection = _this.getSelection();
            var selectedText = selection.toString();

            if(selection && selectedText.length > 0) {

                var range = selection.getRangeAt(0);
                var $parent = $(range.commonAncestorContainer.parentNode);

                if($parent.attr('class') === _this.className || $parent.attr('class') === _this.className + '-wrapper') {
                    var node = document.createElement('span');
                    $(node).attr('data-value', 'temp').html(selectedText.replace(/\n/ig, '<br>'));
                    range.deleteContents();
                    range.insertNode(node);

                    $('[data-value="temp"]').contents().unwrap();
                }
                else {

                    var topMostParent;
                    var hasParentNode = false;
                    $.each($parent.parentsUntil(_this.elem), function(index, el) {
                        topMostParent = el;
                        hasParentNode = true;
                    });

                    if(hasParentNode === true) {
                        $(topMostParent).html($(topMostParent).text().replace(/\n/ig, '<br>')).contents().unwrap();
                    }
                    else {
                        $parent.contents().unwrap();
                    }

                }

            }
        }
        else {
            $(_this.elem).html($(_this.elem).text().replace(/\n/ig, '<br>'));
        }

        // _this.removeEmptyTags();
    };

    // removing empty tags
    EasyEditor.prototype.removeEmptyTags = function(){
        var _this = this;
        $(_this.elem).html( $(_this.elem).html().replace(/(<(?!\/)[^>]+>)+(<\/[^>]+>)+/, '') );
    };

    // wrap selction with a tag
    EasyEditor.prototype.wrapSelectionWithNodeName = function(arg){
        var _this = this;
        if(_this.isSelectionOutsideOfEditor() === true) {
            return false;
        }

        var node = {
            name: 'span',
            blockElement: false,
            style: null,
            class: null,
            attribute: null,
            keepHtml: false
        };

        if(typeof arg === 'string') {
            node.name = arg;
        }
        else {
            node.name = arg.nodeName || node.name;
            node.blockElement = arg.blockElement || node.blockElement;
            node.style = arg.style || node.style;
            node.class = arg.class || node.class;
            node.attribute = arg.attribute || node.attribute;
            node.keepHtml = arg.keepHtml || node.keepHtml;
        }

        var selection = _this.getSelection();

        if(selection && selection.toString().length > 0) {
            if (selection.rangeCount) {

                // checking if already wrapped
                var isWrapped = _this.isAlreadyWrapped(selection, node);

                // wrap node
                var range = selection.getRangeAt(0).cloneRange();
                var tag = document.createElement(node.name);

                    // adding necessary attribute to tag
                    if(node.style !== null || node.class !== null || node.attribute !== null) {
                        tag = _this.addAttribute(tag, node);
                    }

                // if selection contains html, surround contents has some problem with pre html tag and raw text selection
                if(_this.selectionContainsHtml(range)) {
                    range = selection.getRangeAt(0);

                    if(node.keepHtml === true) {
                        var clonedSelection = range.cloneContents();
                        var div = document.createElement('div');
                        div.appendChild(clonedSelection);
                        $(tag).html(div.innerHTML);
                    }
                    else {
                        tag.textContent = selection.toString();
                    }

                    range.deleteContents();
                    range.insertNode(tag);

                    if(range.commonAncestorContainer.localName === node.name) {
                        $(range.commonAncestorContainer).contents().unwrap();
                        _this.removeEmptyTags();
                    }
                }
                else {
                    range.surroundContents(tag);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }

                if(isWrapped === true) {
                    _this.removeWrappedDuplicateTag(tag);
                }

                _this.removeEmptyTags();
                selection.removeAllRanges();
            }
        }
    };

    // if selection contains html tag, surround content fails if selection contains html
    EasyEditor.prototype.selectionContainsHtml = function(range){
        var _this = this;
        if(range.startContainer.parentNode.className === _this.className + '-wrapper') return false;
        else return true;
    };

    // if already wrapped with same tag
    EasyEditor.prototype.isAlreadyWrapped = function(selection, node){
        var _this = this;
        var range = selection.getRangeAt(0);
        var el = $(range.commonAncestorContainer);
        var result = false;

        if( el.parent().prop('tagName').toLowerCase() === node.name && el.parent().hasClass(_this.className) === false ) {
            result = true;
        }
        else if(node.blockElement === true) {
            $.each(el.parentsUntil(_this.elem), function(index, el) {
                var tag = el.tagName.toLowerCase();
                if( $.inArray(tag, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) !== -1 ) {
                    result = true;
                }
            });
        }
        else {
            $.each(el.parentsUntil(_this.elem), function(index, el) {
                var tag = el.tagName.toLowerCase();
                if( tag === node.name ) {
                    result = true;
                }
            });
        }

        return result;
    };

    // remove wrap if already wrapped with same tag
    EasyEditor.prototype.removeWrappedDuplicateTag = function(tag){
        var _this = this;
        var tagName = tag.tagName;

        $(tag).unwrap();

        if($(tag).prop('tagName') === tagName) {
            $(tag).unwrap();
        }
    };

    // adding attribute in tag
    EasyEditor.prototype.addAttribute = function(tag, node){
        if(node.style !== null) {
            $(tag).attr('style', node.style);
        }

        if(node.class !== null) {
            $(tag).addClass(node.class);
        }

        if(node.attribute !== null) {
            $(tag).attr(node.attribute[0], node.attribute[1]);
        }

        return tag;
    };

    // insert a node into cursor point in editor
    EasyEditor.prototype.insertAtCaret = function(node){
        var _this = this;
        if(_this.isSelectionOutsideOfEditor() === true) {
            return false;
        }

        if(_this.getSelection()) {
            var range = _this.getSelection().getRangeAt(0);
            range.insertNode(node);
        }
        else {
            $(node).appendTo(_this.elem);
        }
    };

    // checking if selection outside of editor or not
    EasyEditor.prototype.isSelectionOutsideOfEditor = function(){
        return !this.elementContainsSelection(document.getElementById(this.elem.substring(1)));
    };

    // node contains in containers or not
    EasyEditor.prototype.isOrContains = function(node, container) {
        while (node) {
            if (node === container) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    // selected text is inside container
    EasyEditor.prototype.elementContainsSelection = function(el) {
        var _this = this;
        var sel;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount > 0) {
                for (var i = 0; i < sel.rangeCount; ++i) {
                    if (!_this.isOrContains(sel.getRangeAt(i).commonAncestorContainer, el)) {
                        return false;
                    }
                }
                return true;
            }
        } else if ( (sel = document.selection) && sel.type !== "Control") {
            return _this.isOrContains(sel.createRange().parentElement(), el);
        }
        return false;
    }

    // insert html chunk into editor's temp tag
    EasyEditor.prototype.insertHtml = function(html){
        var _this = this;
        $(_this.elem).find('temp').html(html);
    };

    // utility of editor
    EasyEditor.prototype.utils = function(){
        var _this = this;
        $('.'+ _this.className +'-modal-close').click(function() {
            _this.closeModal('#' + $(this).closest('.'+ _this.className + '-modal').attr('id'));
        });
    };

    // youtube video id from url
    EasyEditor.prototype.getYoutubeVideoIdFromUrl = function(url){
        if(url.length === 0) return false;
        var videoId = '';
        url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
        if(url[2] !== undefined) {
            videoId = url[2].split(/[^0-9a-z_\-]/i);
            videoId = videoId[0];
        }
        else {
            videoId = url;
        }
        return videoId;
    };

    // opening modal window
    EasyEditor.prototype.openModal = function(selector){
        var temp = document.createElement('temp');
        temp.textContent = '.';
        this.insertAtCaret(temp);

        $(selector).removeClass('is-hidden');
    };

    // closing modal window
    EasyEditor.prototype.closeModal = function(selector){
        var _this = this;

        $(selector).addClass('is-hidden').find('input').val('');
        $(selector).find('.' + _this.className + '-modal-content-body-loader').css('width', '0');
        var $temp = $(this.elem).find('temp');

        if($temp.html() === '.') {
            $temp.remove();
        }
        else {
            $temp.contents().unwrap();
        }

        $(this.elem).focus();
    };

    EasyEditor.prototype.bold = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'bold',
            buttonHtml: 'B',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'strong', keepHtml: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.italic = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'italic',
            buttonHtml: 'I',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'em', keepHtml: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.h2 = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'header-2',
            buttonHtml: 'H2',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'h2', blockElement: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.h3 = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'header-3',
            buttonHtml: 'H3',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'h3', blockElement: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.h4 = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'header-4',
            buttonHtml: 'H4',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'h4', blockElement: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.x = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'remove-formatting',
            buttonHtml: 'x',
            clickHandler: function(){
                _this.removeFormatting({ inFullArea: false });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.alignleft = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'align-left',
            buttonHtml: 'Align left',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'p', style: 'text-align: left', class: 'text-left', keepHtml: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.aligncenter = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'align-center',
            buttonHtml: 'Align center',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'p', style: 'text-align: center', class: 'text-center', keepHtml: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.alignright = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'align-right',
            buttonHtml: 'Align right',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'p', style: 'text-align: right', class: 'text-right', keepHtml: true });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.quote = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'quote',
            buttonHtml: 'Quote',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'blockquote' });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.code = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'code',
            buttonHtml: 'Code',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'pre' });
            }
        };

        _this.injectButton(settings);
    };

    EasyEditor.prototype.link = function(){
        var _this = this;
        var settings = {
            buttonIdentifier: 'link',
            buttonHtml: 'Link',
            clickHandler: function(){
                _this.wrapSelectionWithNodeName({ nodeName: 'a', attribute: ['href', prompt('Insert link', '')] });
            }
        };

        _this.injectButton(settings);
    };

    window.EasyEditor = EasyEditor;

})(jQuery, document, window);
