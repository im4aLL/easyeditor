## EasyEditor
A jQuery richtext html / wysiwyg editor, (very lightweight, easy and simple)

* Demo: [http://habibhadi.com/lab/easyeditor/](http://habibhadi.com/lab/easyeditor/)
* Examples: [http://habibhadi.com/lab/easyeditor/examples.html](http://habibhadi.com/lab/easyeditor/examples.html)
* Documentation: [http://habibhadi.com/lab/easyeditor/documentation.html](http://habibhadi.com/lab/easyeditor/documentation.html)

### Usage

[http://habibhadi.com/lab/easyeditor/default-example.html](http://habibhadi.com/lab/easyeditor/default-example.html)

#### Install via Node

`npm install easyeditor --save-dev`

#### Using in Browserify

`require('easyeditor');`

```js
$('.editor').easyEditor({
  buttons: ['bold', 'italic', 'link', 'h2', 'h3', 'h4', 'alignleft', 'aligncenter', 'alignright', 'quote', 'code', 'list', 'x', 'source']
});
```
