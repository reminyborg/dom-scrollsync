# dom-scrollsync
[![npm version][2]][3] [![downloads][8]][9] [![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/) [![ecoonline](http://img.shields.io/badge/development%20sponsored%20by-ecoonline-green.svg?style=flat-square)](http://ecoonline.no/)

Simple dynamic dom scrollsync

## Usage
You can easily add syncscroll to existing dom structures, by hooking onto classes and id.
```html
<div>
  <div id="#left">
    <div class="marker" data-key="1">Lorem<div>
    <div class="marker" data-key="2">Ipsum<div>
    <div class="marker" data-key="3">Gotsum<div>
  </div>
  <div id="#right">
    <div class="marker" data-key="1">Lorem<div>
    <div class="marker" data-key="2">Ipsum<div>
    <div class="marker" data-key="3">Gotsum<div>
  </div>
</div>
```

```js
var ScrollSync = require('dom-scrollsync')

var scrollsync = ScrollSync({
  offset: 30,
  containers: ['#left', '#right'],
  markers: '.marker'
})

// now... call this everytime you think that your content might have changed. Its ok... its cheap.
scrollsync.update()
```

[2]: https://img.shields.io/npm/v/dom-scrollsync.svg?style=flat-square
[3]: https://npmjs.org/package/dom-scrollsync
[8]: http://img.shields.io/npm/dm/dom-scrollsync.svg?style=flat-square
[9]: https://npmjs.org/package/dom-scrollsync
