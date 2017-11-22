var Nanocomponent = require('nanocomponent')
var html = require('bel')
var ScrollSync = require('./index')

var isIframe = false
try {
  isIframe = window.self !== window.top
} catch (e) {
  isIframe = true
}

function Compare () {
  if (!(this instanceof Compare)) return new Compare()
  Nanocomponent.call(this)

  this.leftHeight = 3000
  this.rightHeight = 2000
  this.left = [1, 10, 20, 30, 60, 90]
  this.right = [10, 20, 50, 70, 75, 90]
  this.sync = ScrollSync({
    id: 'sync',
    offset: 0,
    containers: !isIframe
      ? ['#left', '#right', '#iframe']
      : ['#right', window.parent],
    markers: '.marker'
  })
}
Compare.prototype = Object.create(Nanocomponent.prototype)

Compare.prototype.createElement = function () {
  if (!isIframe) {
    return html`
      <div>
        <div style="width: 600px; height: 500px; display: flex; overflow: hidden;">
          <div id="left" style="flex: auto; overflow-y: scroll;">
            <div style="
              height: ${this.leftHeight}px; position: relative;
              background: repeating-linear-gradient(
                transparent,
                transparent 10px,
                rgba(0, 255, 0, 0.2) 10px,
                rgba(0, 255, 0, 0.2) 20px);"
            >
              ${this.left.map(renderMarker)} 
            </div>
          </div>
          <div id="right" style="flex: auto; overflow-y: scroll;">
            <div style="
              height: ${this.rightHeight}px; position: relative;
              background: repeating-linear-gradient(
                transparent,
                transparent 10px,
                rgba(255, 0, 0, 0.2) 10px,
                rgba(255, 0, 0, 0.2) 20px);"
            >
              ${this.right.map(renderMarker)}
            </div>
          </div>
        </div>
        <iframe style="height: 400px; widht: 400px; "id="iframe" src="/">
        </iframe>
      </div>
    `
  } else {
    return html`
      <div style="width: 280px; height: 380px; display: flex; overflow: hidden;">
        <div id="right" style="flex: auto; overflow-y: scroll;">
          <div style="
            height: ${this.rightHeight}px; position: relative;
            background: repeating-linear-gradient(
              transparent,
              transparent 10px,
              rgba(255, 0, 0, 0.2) 10px,
              rgba(255, 0, 0, 0.2) 20px);"
          >
            ${this.right.map(renderMarker)}
          </div>
        </div>
      </div>
    `
  }
}

Compare.prototype.afterupdate = function () {
  this.sync.update()
}

Compare.prototype.load = function () {
  this.sync.update()
}

function renderMarker (marker, index) {
  return html`
    <div class="marker" style="
      position: absolute; top: ${marker}%;
      padding: 5px;
      border: solid gray 1px;
      background-color: white;"
    >
      ${index}
    </div>
  `
}

var compare = new Compare()
document.body.appendChild(compare.render())
