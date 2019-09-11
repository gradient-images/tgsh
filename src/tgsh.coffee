graph = '{
  "name": "Nyulcsapda",
  "kids": [{
    "name": "VFX",
    "kids": [{
      "name": "Sc_1"
    }, {
      "name": "Sc_2"
    }, {
      "name": "Sc_3"
    }]
  }, {
    "name": "Grade"
  }, {
    "name": "Asset"
  }, {
    "name": "Edit"
  }, {
    "name": "In"
  }
]}
'

fontHeight = 18
fontWidth = fontHeight * .75
fontFamily = 'Roboto Mono'
regular = fontHeight + 'px ' + fontFamily
bold = 'bold ' + fontHeight + 'px ' + fontFamily
minNameWidth = 1 * fontWidth
noTypoRad = Math.sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2)
nameFadeWidth = 2 * fontWidth
nameFadeRad = Math.sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2)
pi2 = Math.PI * 2

raid = 0
timer = performance.now()

canvas = document.getElementById('canvas')

vp =
  scale: 1
  separation: 0.9
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
  @fromJSON: (nodesJSON) ->
    obj = JSON.parse(nodesJSON)
    node = Object.assign(new Node(obj), obj)

  constructor: (obj) ->
    @x = 0
    @y = 0
    @rad = 1

    ctx = canvas.getContext('2d')
    ctx.font = bold
    nameMeasure = ctx.measureText(obj.name + ' ')
    @nameWidth = nameMeasure.width

    if obj.kids
      obj.kids = (Object.assign(new Node(kid), kid) for kid in obj.kids)

  layout: (x, y, rad) ->
    @x = x
    @y = y
    @rad = rad
    if @kids
      nKids = @kids.length
      kidRad = Math.sqrt(rad ** 2 / nKids)
      kidRing = rad + kidRad
      slice = pi2 / nKids
      kid.layout(Math.sin(slice * i) * kidRing + x, -Math.cos(slice * i) * kidRing + y, kidRad) for kid, i in @kids

  draw: (ctx) ->
    # Calculate details
    dispRad = @rad * vp.min * vp.separation / 2 * vp.scale
    dispX = vp.cx + (@x * vp.min * vp.separation / 2 * vp.scale)
    dispY = vp.cy + (@y * vp.min * vp.separation / 2 * vp.scale)

    ctx.save()

    # Outline
    ctx.beginPath()
    ctx.arc(dispX, dispY, dispRad, 0, pi2, 0)
    ctx.fill()
    ctx.clip()

    # Name
    ctx.fillStyle = '#808080'
    if dispRad > noTypoRad
      typoBase = 2 * Math.sqrt(dispRad ** 2 - (fontHeight / 2) ** 2)

      # Align
      if typoBase > @nameWidth
        ctx.textAlign = 'center'
        nx = dispX
      else
        ctx.textAlign = 'left'
        nx = dispX - typoBase / 2 + fontWidth / 2

      if dispRad > nameFadeRad
        ctx.globalAlpha = 1
      else
        ctx.globalAlpha = (dispRad - noTypoRad) / (nameFadeRad - noTypoRad)

      ctx.font = bold
      ctx.textBaseline = 'middle'
      ctx.fillText(@name, nx, dispY)

    ctx.restore()

    if @kids
      kid.draw(ctx) for kid in @kids


draw = ->
  ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, vp.width, vp.height)
  ctx.save()

  root.layout(0, 0, 1)
  root.draw(ctx)

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

# Init from here on, just like that. See `graph` at the top.

root = Node.fromJSON(graph)
console.log(root)

if canvas.getContext
  vp.update()
  window.onresize = resizeInteract
  window.onwheel = wheelInteract
  window.requestAnimationFrame(draw)

# console.log("Finished.")
