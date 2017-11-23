/* global requestAnimationFrame */
function ScrollSync (options) {
  if (!(this instanceof ScrollSync)) return new ScrollSync(options)
  this.options = options
  this.sync = this.sync.bind(this)
  this.updateSlaves = this.updateSlaves.bind(this)

  this.syncs = options.containers.map(() => throttle(this.sync))

  window.addEventListener('message', e => {
    if (
      typeof e.data.type !== 'undefined' &&
      e.data.type === 'dom-scrollsync' &&
      e.data.id === options.id
    ) {
      this.updateSlaves(false, e.data.bounds, e.data.offset)
    }
  })
}

ScrollSync.prototype.update = function (props) {
  props = props || {}
  this.enabled = typeof props.enabled === 'undefined' ? true : props.enabled
  this.containers = this.options.containers.map((selector, index) => {
    if (typeof selector !== 'string') {
      return { window: selector }
    }
    var element = document.querySelector(selector)
    if (element.tagName === 'IFRAME') {
      return { window: element.contentWindow }
    }

    element.addEventListener('scroll', this.syncs[index], false)
    var markersById = getMarkers(
      Array.from(element.querySelectorAll(this.options.markers)),
      element,
      this.options.keyName
    )
    var markers = Object.keys(markersById).map(id => markersById[id])
    return {
      selector: selector,
      element: element,
      markers: markers,
      markersById: markersById
    }
  })

  if (this.options.debug) console.log('containers', this.containers)
  this.sync()
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
    ? master.element.parentNode.clientHeight * this.options.offset / 100
    : 0

  var scroll =
    (master.element.scrollTop + offset) / master.element.scrollHeight * 100
  var index = master.markers.findIndex(pos => pos.top > scroll)
  if (index === -1) return
  var last = index === 0 ? false : master.markers[index - 1]
  var next = master.markers[index]
  var bounds = [
    last,
    next,
    (scroll - (last.top || 0)) / (next.top - (last.top || 0))
  ]
  this.updateSlaves(master, bounds, offset)
}

ScrollSync.prototype.updateSlaves = function (master, bounds, offset) {
  if (this.options.debug) console.log('master', bounds[0], bounds[1], bounds[2])
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

    var diff = bounds[2]
    var slaveBounds = [
      slave.markersById[bounds[0].id],
      slave.markersById[bounds[1].id]
    ]
    if (typeof slaveBounds[0] === 'undefined') {
      slaveBounds[0] = findNext(slave.markers, slave.markers.length, (m) => m.id < bounds[0].id, -1)
    }
    if (typeof slaveBounds[1] === 'undefined') {
      slaveBounds[1] = findNext(slave.markers, 0, (m) => m.id > bounds[1].id, 1)
      diff = diff / 2
    }
    var addToTop = (slaveBounds[1].top - (slaveBounds[0].top || 0)) * diff
    if (this.options.debug) console.log('slave', slaveBounds[0], slaveBounds[1], addToTop)

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

function findNext (list, index, check, direction) {
  if (typeof list[index + direction] === undefined) return list[index]
  if (check(list[index + direction])) return list[index + direction]
  return findNext(list, index + direction, check, direction)
}

function getOffset (element, container) {
  var child = element.getBoundingClientRect()
  var parent = container.getBoundingClientRect()
  return child.top - parent.top
}

module.exports = ScrollSync
