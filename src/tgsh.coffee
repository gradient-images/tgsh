# Defaults
fontHeight = 14
fontWidth = fontHeight * .75
fontFamily = 'Roboto Mono'
regular = fontHeight + 'px ' + fontFamily
bold = 'bold ' + fontHeight + 'px ' + fontFamily
minNameWidth = 1 * fontWidth
noTypoRad = Math.sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2)
nameFadeWidth = 2 * fontWidth
nameFadeRad = Math.sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2)
pi2 = Math.PI * 2

timer = performance.now()

canvas = document.getElementById('canvas')

vp =
  scale: .333
  offx: 0
  offy: 0
  separation: 1.1
  fat: 1.1
  panning: false
  panx: 0
  pany: 0
  panstx: 0
  pansty: 0
  update: ->
    w = window.innerWidth
    h = window.innerHeight

    canvas.width = w
    canvas.height = h

    @width = w
    @height = h
    @min = Math.min(w, h)
    @unit = @min / @separation / 2 * @scale
    @cx = w / 2 + @offx * @unit
    @cy = h / 2 + @offy * @unit



class Node
  constructor: (obj) ->
    @x = 0
    @y = 0
    @rad = 1
    @name = obj.name

    ctx = canvas.getContext('2d')
    ctx.font = bold
    nameMeasure = ctx.measureText(' ' + obj.name)
    @nameWidth = nameMeasure.width

    @files = []
    @dirs = []
    if obj.contents
      for kid, i in obj.contents
        if kid.type == 'directory'
          @dirs.push(new Node(kid))
        else if kid.type == 'file'
          @files.push(new Node(kid))

  layout: (@x=0, @y=0, @rad=1, @slice=Math.PI, @dir = 0) ->
    dist = Math.sqrt(@x ** 2 + @y ** 2)

    if @dirs
      nKids = @dirs.length
      if nKids == 1
        wishRad = @rad / vp.separation
      else
        wishRad = Math.sqrt(@rad ** 2 / nKids) * vp.fat
      kidDist = dist + (@rad + wishRad) * vp.separation
      wishSlice = Math.asin(wishRad / kidDist)
      kidSlice = @slice / nKids

      if wishSlice < kidSlice
        kidRad = wishRad
      else
        kidRad = Math.sin(kidSlice) * kidDist

      if @rad != 1
        firstKidDir = @dir - @slice + kidSlice
      else
        firstKidDir = @dir

      i = 0
      while i < nKids
        kidDir = firstKidDir + kidSlice * i * 2
        @dirs[i].layout(Math.sin(kidDir) * kidDist, -Math.cos(kidDir) * kidDist, kidRad, kidSlice, kidDir)
        i++

    # Fatsy root
    if @rad == 1
      @rad = vp.separation

  draw: (ctx) ->
    # Calculate details
    dispRad = @rad * vp.unit / vp.separation
    dispX = vp.cx + @x * vp.unit
    dispY = vp.cy + @y * vp.unit

    ctx.save()

    # Draw lines
    if @dirs
      ctx.lineWidth = dispRad * .15 / @dirs.length ** .5
      ctx.strokeStyle = '#606060'
      i = 0
      while i < @dirs.length
        k = @dirs[i]
        ctx.beginPath()
        ctx.moveTo(dispX, dispY)
        kdX = vp.cx + k.x * vp.unit
        kdY = vp.cy + k.y * vp.unit
        ctx.lineTo(kdX, kdY)
        ctx.stroke()
        i++

    # Outline
    ctx.fillStyle = '#202020'
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

    if @dirs
      kid.draw(ctx) for kid in @dirs


drawScreen = ->
  ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, vp.width, vp.height)
  ctx.save()

  vp.root.layout()
  vp.root.draw(ctx)

  t = performance.now()
  ctx.font = regular
  ctx.textAlign = 'left'
  ctx.fillText(Math.round(1000 / (t - timer)) + " FPS", 50, 50)
  timer = t

  ctx.restore()

resizeAct = ->
  vp.update()
  window.requestAnimationFrame(drawScreen)

wheelAct = (event) ->
  scale = vp.scale
  scale *= 1 + event.deltaY * -0.01
  scale = Math.max(.001, Math.min(1000, scale))
  vp.scale = scale
  vp.update()
  window.requestAnimationFrame(drawScreen)

mouseDownAct = (e) ->
  console.log("Pressed$ " + e.clientX)
  vp.panx = e.clientX
  vp.pany = e.clientY
  vp.panstx = vp.offx
  vp.pansty = vp.offy
  vp.panning = true

mouseMoveAct = (e) ->
  if vp.panning
    vp.offx = vp.panstx + (e.clientX - vp.panx) / vp.unit
    vp.offy = vp.pansty + (e.clientY - vp.pany) / vp.unit
    vp.update()
    window.requestAnimationFrame(drawScreen)

mouseUpAct = (e) ->
  vp.panning = false

# Init from here on, just like that.

req = new XMLHttpRequest()
req.open('GET', 'https://gradient-images.github.io/tgsh/tgsh_tree.json')
req.responseType = 'json'
req.onload = ->
  vp.root = new Node(req.response[0])
  console.log(vp.root)

  if canvas.getContext
    vp.update()
    console.log(vp)
    window.onmousedown = mouseDownAct
    window.onmouseup = mouseUpAct
    window.onmousemove = mouseMoveAct
    window.onresize = resizeAct
    window.onwheel = wheelAct
    window.requestAnimationFrame(drawScreen)

req.send()
