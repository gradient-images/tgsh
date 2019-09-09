canvas = document.getElementById('canvas')

vp =
  scale: 1
  fit_ratio: 0.9
  update: ->
    w = window.innerWidth
    h = window.innerHeight

    canvas.width = w
    canvas.height = h

    @width = w
    @height = h
    @cx = w / 2
    @cy = h / 2
    @min = Math.min(w, h)

n =
  rad: 1

raid = 0

draw = ->
  ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, vp.width, vp.height)

  ctx.beginPath()
  ctx.arc(vp.cx, vp.cy, n.rad * vp.min * vp.fit_ratio / 2 * vp.scale, 0, Math.PI*2, 0)
  ctx.fill()

  raid = window.requestAnimationFrame(draw)

resizeCanvas = ->
  window.cancelAnimationFrame(raid)
  vp.update()
  raid = window.requestAnimationFrame(draw)

if canvas.getContext
  vp.update()
  window.onresize = resizeCanvas
  window.requestAnimationFrame(draw)

# console.log("Finished.")
