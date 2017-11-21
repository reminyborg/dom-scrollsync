function ScrollSync (options) {
  if (!(this instanceof ScrollSync)) return new ScrollSync(options)
  this.options = options
  this.sync = this.sync.bind(this)
}

ScrollSync.prototype.update = function (props) {
  props = props || {}
  this.enabled = typeof props.enabled === 'undefined' ? true : props.enabled
  this.containers = this.options.containers.map(selector => {
    var element = document.querySelector(selector)
    element.addEventListener('scroll', this.sync, false)
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

  this.containers.forEach(slave => {
    if (master === slave) return
    var offset = this.options.offset
      ? master.element.parentNode.clientHeight * this.options.offset / 100
      : 0

    var scroll =
      (master.element.scrollTop + offset) / master.element.scrollHeight * 100
    var index = master.markers.findIndex(pos => pos.top > scroll)
    if (index === -1) return
    var bounds = [
      index === 0 ? false : master.markers[index - 1],
      master.markers[index]
    ]
    var boundsPosition =
      (scroll - (bounds[0].top || 0)) / (bounds[1].top - (bounds[0].top || 0))

    var slaveBounds = [
      slave.markersById[bounds[0].id] || false,
      slave.markersById[bounds[1].id]
    ]
    if (typeof slaveBounds[1] === 'undefined') return
    var addToTop =
      (slaveBounds[1].top - (slaveBounds[0].top || 0)) * boundsPosition

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
        top: addOffsets(element, container) / container.scrollHeight * 100
      }
    }
    return list
  }, {})
}

function addOffsets (element, container) {
  var offset = element.offsetTop
  if (element === container) return offset
  return offset + addOffsets(element.parentNode, container)
}

module.exports = ScrollSync
