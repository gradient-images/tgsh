fontHeight = 18
fontWidth = fontHeight * .75
fontFamily = 'Roboto Mono'
regular = fontHeight + 'px ' + fontFamily
bold = 'bold ' + fontHeight + 'px ' + fontFamily
minNameWidth = 1 * fontWidth
noTypoRad = Math.sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2)
nameFadeWidth = 2 * fontWidth
nameFadeRad = Math.sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2)

raid = 0
timer = performance.now()

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


class Node
  constructor: (@name, @x, @y, @rad) ->
    ctx = canvas.getContext('2d')
    ctx.font = bold
    nameMeasure = ctx.measureText(@name + ' ')

    @nameWidth = nameMeasure.width

  draw: (ctx) ->
    # Calculate details
    dispRad = n.rad * vp.min * vp.fit_ratio / 2 * vp.scale

    ctx.save()

    # Outline
    ctx.beginPath()
    ctx.arc(vp.cx, vp.cy, dispRad, 0, Math.PI*2, 0)
    ctx.fill()
    ctx.clip()

    # Name
    ctx.fillStyle = '#808080'
    if dispRad > noTypoRad
      typoBase = 2 * Math.sqrt(dispRad ** 2 - (fontHeight / 2) ** 2)

      # Align
      if typoBase > @nameWidth
        ctx.textAlign = 'center'
        nx = vp.cx
      else
        ctx.textAlign = 'left'
        nx = vp.cx - typoBase / 2 + fontWidth / 2

      if dispRad > nameFadeRad
        ctx.globalAlpha = 1
      else
        ctx.globalAlpha = (dispRad - noTypoRad) / (nameFadeRad - noTypoRad)

      ny = vp.cy
      ctx.font = bold
      ctx.textBaseline = 'middle'
      ctx.fillText(@name, nx, ny)

    ctx.restore()


draw = ->
  ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, vp.width, vp.height)
  ctx.save()

  n.draw(ctx)

  t = performance.now()
  ctx.font = regular
  ctx.textAlign = 'left'
  ctx.fillText(Math.round(1000 / (t - timer)) + " FPS", 50, 50)
  timer = t

  ctx.restore()

resizeInteract = ->
  vp.update()
  raid = window.requestAnimationFrame(draw)

wheelInteract = (event) ->
  scale = vp.scale
  scale *= 1 + event.deltaY * -0.01
  scale = Math.max(.01, Math.min(4, scale))
  vp.scale = scale
  raid = window.requestAnimationFrame(draw)


n = new Node("File Name", 0, 0, 1)

if canvas.getContext
  vp.update()
  window.onresize = resizeInteract
  window.onwheel = wheelInteract
  window.requestAnimationFrame(draw)

# console.log("Finished.")
