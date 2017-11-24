/* global requestAnimationFrame */
function ScrollSync (options) {
  if (!(this instanceof ScrollSync)) return new ScrollSync(options)
  this.options = options
  this.sync = this.sync.bind(this)
  this.updateSlaves = this.updateSlaves.bind(this)
  this.updateFilteredMarkers = this.updateFilteredMarkers.bind(this)

  this.syncs = options.containers.map(() => throttle(this.sync))

  window.addEventListener('message', e => {
    if (
      typeof e.data.type !== 'undefined' &&
      e.data.type === 'dom-scrollsync' &&
      e.data.id === options.id &&
      this.containers
    ) {
      if (e.data.bounds) {
        this.updateSlaves(false, e.data.bounds, e.data.offset)
      } else if (e.data.rawmarkers) {
        this.containers.forEach((container) => {
          if (container.window) {
            container.rawmarkers = e.data.rawmarkers
            container.markersById = e.data.markersById
          }
        })
        this.updateFilteredMarkers()
      }
    }
  })
}

ScrollSync.prototype.update = function (props) {
  props = props || {}
  this.enabled = typeof props.enabled === 'undefined' ? true : props.enabled
  var windows = []
  this.containers = this.options.containers.map((selector, index) => {
    if (typeof selector !== 'string') {
      windows.push(selector)
      return { window: selector }
    }
    var element = document.querySelector(selector)
    if (element.tagName === 'IFRAME') {
      element.onload = () => this.update(props)
      windows.push(element.contentWindow)
      return { window: element.contentWindow }
    }

    element.addEventListener('scroll', this.syncs[index], false)
    var markersById = getMarkers(
      Array.from(element.querySelectorAll(this.options.markers)),
      element,
      this.options.keyName
    )
    var rawmarkers = Object.keys(markersById).map(id => markersById[id])
    return {
      selector: selector,
      element: element,
      rawmarkers: rawmarkers,
      markersById: markersById
    }
  })

  windows.forEach((win) => {
    this.containers.forEach((container) => {
      if (container.element) {
        win.postMessage({
          id: this.options.id,
          type: 'dom-scrollsync',
          selector: container.selector,
          rawmarkers: container.rawmarkers,
          markersById: container.markersById
        }, '*')
      }
    })
  })

  this.updateFilteredMarkers()

  this.sync()
}

ScrollSync.prototype.updateFilteredMarkers = function () {
  var filter = false
  this.containers.forEach((container) => {
    if (container.markersById) {
      var keys = Object.keys(container.markersById)
      if (filter === false) filter = keys
      else filter = filter.filter((f) => keys.indexOf(f) !== -1)
    }
  })

  this.containers.forEach((container) => {
    if (container.markersById) {
      container.markers = filter.map((prop) => container.markersById[prop])
    }
  })

  if (this.options.debug) console.log(this.containers)
}

ScrollSync.prototype.sync = function (e) {
  if (!this.enabled) return
  var master =
    typeof e !== 'undefined'
      ? this.containers.find(c => c.element === e.target)
      : this.containers[0]
  if (typeof master === 'undefined') return
  if (master.element.scrollTop === master.lastScroll) return

  var offset = this.options.offset
    ? master.element.clientHeight * this.options.offset / 100
    : 0

  var scroll =
    (master.element.scrollTop + offset) / master.element.scrollHeight * 100
  var index = master.markers.findIndex(pos => pos.top > scroll)
  if (index === -1) return
  var last = index === 0 ? false : master.markers[index - 1]
  var next = master.markers[index]
  this.updateSlaves(
    master,
    [last, next, (scroll - (last.top || 0)) / (next.top - (last.top || 0))],
    offset
  )
}

ScrollSync.prototype.updateSlaves = function (master, bounds, offset) {
  this.containers.forEach(slave => {
    if (master === slave) return
    if (!master && slave.window) return
    if (slave.window) {
      slave.window.postMessage(
        {
          id: this.options.id,
          type: 'dom-scrollsync',
          bounds: bounds,
          offset: offset,
          selector: slave.selector
        },
        '*'
      )
      return
    }

    var slaveBounds = [
      slave.markersById[bounds[0].id] || false,
      slave.markersById[bounds[1].id]
    ]
    if (typeof slaveBounds[1] === 'undefined') return
    var addToTop = (slaveBounds[1].top - (slaveBounds[0].top || 0)) * bounds[2]

    slave.lastScroll = Math.round(
      slave.element.scrollHeight *
        ((slaveBounds[0].top || 0) + addToTop) /
        100 -
        offset
    )

    slave.element.scrollTop = slave.lastScroll
  })
}

function getMarkers (markers, container, indexName) {
  return markers.reduce((list, element, index) => {
    if (indexName) index = element.dataset[indexName]
    if (typeof index !== 'undefined' && typeof list[index] === 'undefined') {
      list[index] = {
        id: index,
        top: getOffset(element, container) / container.scrollHeight * 100
      }
    }
    return list
  }, {})
}

function throttle (callback) {
  var requestId
  var later = (context, args) => () => {
    requestId = null
    callback.apply(context, args)
  }

  var throttled = function (...args) {
    if (requestId === null || requestId === undefined) {
      requestId = requestAnimationFrame(later(this, args))
    }
  }
  return throttled
}

function getOffset (element, container) {
  var child = element.getBoundingClientRect()
  var parent = container.getBoundingClientRect()
  return child.top - parent.top + container.scrollTop
}

module.exports = ScrollSync
