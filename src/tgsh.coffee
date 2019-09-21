{PI, sqrt, sin, cos, asin, acos, atan, min, max, round, ceil} = Math

dist = (x, y) ->
  sqrt(x ** 2 + y ** 2)

# Constants
fontHeight = 14
fontWidth = fontHeight * .75
fontFamily = 'Roboto Mono'

regular = fontHeight + 'px ' + fontFamily
bold = 'bold ' + fontHeight + 'px ' + fontFamily
minNameWidth = 1 * fontWidth
noTypoRad = dist(minNameWidth / 2, fontHeight / 2)
nameFadeWidth = 2 * fontWidth
nameFadeRad = dist(nameFadeWidth / 2, fontHeight / 2)

# areaLoss = PI / 4 * .5
gr = (1 + 5**.5) / 2
ga = PI*2 / gr**2

timer = performance.now()
canvas = document.getElementById('canvas')

vp =
  scale: .333
  rot: -PI / 2
  offx: 0
  offy: 0
  pX: 0
  pY: 0
  sep: 1.1
  fat: 1.1
  panning: false
  panx: 0
  pany: 0
  panstx: 0
  pansty: 0
  minDispRad: 0.01
  update: ->
    @width = window.innerWidth
    @height = window.innerHeight
    canvas.width = @width
    canvas.height = @height
    @min = min(@width, @height)
    @unit = @min / @sep / 2 * @scale
    @cx = @width / 2 + @offx * @unit
    @cy = @height / 2 + @offy * @unit


class Node
  constructor: (obj) ->
    @x = 0
    @y = 0
    @rad = 1
    @hideDirs = false
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

  layout: (@x=0, @y=0, @rad=1, @slice=PI, @dir = 0) ->
    nDist = dist(@x, @y)

    if @dirs.length > 0
      nDirs = @dirs.length

      if nDirs == 1
        wishRad = @rad / vp.sep
      else
        wishRad = sqrt(@rad ** 2 / nDirs) * vp.fat

      if wishRad * vp.scale < vp.minDispRad
        @hideDirs = true
      else
        @hideDirs = false
        dirDist = nDist + (@rad + wishRad) * vp.sep
        wishSlice = asin(wishRad / dirDist)
        dirSlice = @slice / nDirs

        if wishSlice < dirSlice
          dirRad = wishRad
        else
          dirRad = sin(dirSlice) * dirDist

        if @rad != 1
          firstDirDir = @dir - @slice + dirSlice
        else
          firstDirDir = vp.rot

        for dir, i in @dirs
          kidDir = firstDirDir + dirSlice * i * 2
          dir.layout(cos(kidDir) * dirDist, \
                     sin(kidDir) * dirDist, \
                     dirRad, dirSlice, kidDir)

    # Fatsy root
    if @rad == 1
      @rad = vp.sep

  draw: (ctx) ->
    # Calculate details
    dispRad = @rad * vp.unit / vp.sep
    dispX = vp.cx + @x * vp.unit
    dispY = vp.cy + @y * vp.unit

    ctx.save()

    # Draw lines
    if @dirs.length > 0
      if @hideDirs
        # flagRad = @rad * vp.sep ** 4
        # flagRad = @rad * (1 + .0333 / vp.scale * @rad))
        sRad = @rad * vp.scale
        flagRad = @rad + .02 / vp.scale
        flagSlice = (PI / 2 + asin(@rad / vp.sep / dist(@x, @y)) \
            - acos(@rad / vp.sep / flagRad)) / vp.sep
        flagStartX = flagRad * cos(@dir - flagSlice) + @x
        flagStartY = flagRad * sin(@dir - flagSlice) + @y
        # console.log(flagRad, @slice, flagSlice, flagStartX, flagStartY)
        ctx.beginPath()
        ctx.moveTo(dispX, dispY)
        ctx.lineTo(vp.cx + flagStartX * vp.unit, vp.cy + flagStartY * vp.unit)
        ctx.arc(dispX, dispY, flagRad * vp.unit, @dir - flagSlice, @dir + flagSlice)
        ctx.fillStyle = '#a0a0a0'
        ctx.fill()
      else
        ctx.lineWidth = dispRad * .15 / @dirs.length ** .5
        ctx.strokeStyle = '#606060'
        for d, i in @dirs
          ctx.beginPath()
          ctx.moveTo(dispX, dispY)
          ddX = d.x * vp.unit + vp.cx
          ddY = d.y * vp.unit + vp.cy
          ctx.lineTo(ddX, ddY)
          if i == 0
            lw = ctx.lineWidth
            ctx.lineWidth = lw * 1.333
            ctx.strokeStyle = '#303030'
            ctx.stroke()
            ctx.lineWidth = lw * .75
            ctx.strokeStyle = '#606060'
            ctx.stroke()
            ctx.lineWidth = lw
          else
            ctx.stroke()

    # Selection indicator
    if dist(dispX - vp.pX, dispY - vp.pY) < dispRad
      ctx.beginPath()
      ctx.fillStyle = '#c0c0c0'
      ctx.arc(dispX, dispY, dispRad + 5, 0, PI*2)
      ctx.fill()

    # Body
    ctx.fillStyle = '#404040'
    ctx.beginPath()
    ctx.arc(dispX, dispY, dispRad, 0, PI*2)
    ctx.fill()
    ctx.clip()

    # Inner circle
    ctx.fillStyle = '#303030'
    ctx.beginPath()
    ctx.arc(dispX, dispY, inRad * vp.unit, 0, PI*2)
    ctx.fill()

    # Files
    fAreaRad = @rad / vp.sep ** 1.5
    inRad = vp.sep - 1
    nFiles = @files.length
    if nFiles > 0
      primScale = 1 / sqrt((1 + nFiles * (1 + inRad)) * gr)
      scale = fAreaRad * primScale * (1 - primScale)
      # fDispRad = scale * vp.unit
      fDispWidth = sqrt(2) * scale * vp.unit

      ctx.fillStyle = '#606060'
      for f, i in @files
        fDist = sqrt((1 + (nFiles - i) + nFiles * inRad) * gr) * scale
        fDir = ga * i - PI / 2
        # console.log(@name, "scale:", scale, "fDist:", fDist, "fDispRad:", fDispRad)
        fX = (@x + cos(fDir) * fDist) * vp.unit + vp.cx - fDispWidth / 2
        fY = (@y + sin(fDir) * fDist) * vp.unit + vp.cy - fDispWidth / 2
        ctx.beginPath()
        ctx.fillRect(fX, fY, fDispWidth, fDispWidth)
        # ctx.arc(fX, fY, fDispRad, 0, 2*PI)
        ctx.fill()

    # Name
    ctx.fillStyle = '#c0c0c0'
    if dispRad > noTypoRad
      typoBase = 2 * sqrt(dispRad ** 2 - (fontHeight / 2) ** 2)

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

    # Draw directories
    if @dirs.length > 0 and not @hideDirs
      dir.draw(ctx) for dir in @dirs


drawScreen = ->
  ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, vp.width, vp.height)
  ctx.save()

  vp.root.layout()
  vp.root.draw(ctx)

  t = performance.now()
  ctx.font = regular
  ctx.textAlign = 'left'
  ctx.fillText(round(1000 / (t - timer)) + " FPS", 50, 50)
  timer = t

  ctx.restore()

resizeAct = ->
  vp.update()
  window.requestAnimationFrame(drawScreen)

wheelAct = (e) ->
  if e.shiftKey
    vp.rot += e.deltaY / 180 / vp.scale ** .5
  else
    delta = e.deltaY * -0.01
    scale = vp.scale * (1 + delta)
    scale = max(.001, Math.min(1000, scale))
    vp.offx += (vp.width / 2 - e.clientX) * delta * vp.sep ** 2 / vp.unit
    vp.offy += (vp.height / 2 - e.clientY) * delta * vp.sep ** 2 / vp.unit
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
  vp.pX = e.clientX
  vp.pY = e.clientY
  window.requestAnimationFrame(drawScreen)

mouseUpAct = (e) ->
  vp.panning = false

# Init from here on, just like that.

req = new XMLHttpRequest()
req.open('GET', 'https://gradient-images.github.io/tgsh/tgsh_tree.json')
# req.open('GET', 'https://gradient-images.github.io/tgsh/teflon_tree.json')
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
