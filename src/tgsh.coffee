{PI, sqrt, sin, cos, asin, acos, atan, min, max, round} = Math

# Constants
fontHeight = 14
fontWidth = fontHeight * .75
fontFamily = 'Roboto Mono'

regular = fontHeight + 'px ' + fontFamily
bold = 'bold ' + fontHeight + 'px ' + fontFamily
minNameWidth = 1 * fontWidth
noTypoRad = sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2)
nameFadeWidth = 2 * fontWidth
nameFadeRad = sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2)
areaLoss = PI / 4 * .5
# gr = (1 + 5**.5) / 2
# ga = PI*2 / gr**2

timer = performance.now()
canvas = document.getElementById('canvas')

vp =
  scale: .333
  rot: -PI / 2
  offx: 0
  offy: 0
  sep: 1.1
  fat: 1.1
  panning: false
  panx: 0
  pany: 0
  panstx: 0
  pansty: 0
  minDispRad: 0.01
  update: ->
    w = window.innerWidth
    h = window.innerHeight

    canvas.width = w
    canvas.height = h

    @width = w
    @height = h
    @min = min(w, h)
    @unit = @min / @sep / 2 * @scale
    @cx = w / 2 + @offx * @unit
    @cy = h / 2 + @offy * @unit



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
    dist = sqrt(@x ** 2 + @y ** 2)

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
        dirDist = dist + (@rad + wishRad) * vp.sep
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
        flagRad = @rad * (1 + .0333 / (vp.scale * @rad))
        flagSlice = (PI / 2 + asin(@rad / vp.sep / sqrt(@x ** 2 + @y ** 2)) \
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
            ctx.strokeStyle = '#909090'
            ctx.stroke()
            ctx.lineWidth = lw
            ctx.strokeStyle = '#606060'
          else
            ctx.stroke()

    # Body
    ctx.fillStyle = '#202020'
    ctx.beginPath()
    ctx.arc(dispX, dispY, dispRad, 0, PI*2)
    ctx.fill()
    ctx.clip()

    sepRad = @rad / vp.sep ** .5
    ctx.beginPath()
    ctx.fillStyle = '#404040'
    ctx.arc(dispX, dispY, sepRad * vp.unit / vp.sep, 0, PI*2)
    ctx.fill()

    # Files
    if @files.length > 0
      inRad = sepRad - (sepRad / vp.sep ** 2)
      ctx.fillStyle = '#202020'
      ctx.beginPath()
      ctx.arc(dispX, dispY, inRad * vp.unit, 0, PI*2)
      ctx.fill()
      ctx.fillStyle = '#606060'
      nFiles = @files.length
      slice = PI * 2 / nFiles
      area = (sepRad ** 2 - inRad ** 2) * PI
      wishRad = min(sqrt(area * areaLoss / nFiles / PI), (sepRad - inRad) / 2)
      fileDispRad = wishRad / vp.sep * vp.unit
      fileDist = inRad + (sepRad - inRad) / 2
      # console.log(nFiles, inRad, slice, area, wishRad, fileDist)
      for f, i in @files
        fDir = i * slice - PI / 2
        fX = (@x + cos(fDir) * fileDist) * vp.unit + vp.cx
        fY = (@y + sin(fDir) * fileDist) * vp.unit + vp.cy
        ctx.beginPath()
        ctx.arc(fX, fY, fileDispRad, 0, 2*PI)
        ctx.fill()

    # Name
    ctx.fillStyle = '#a0a0a0'
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
    scale = vp.scale
    scale *= 1 + e.deltaY * -0.01
    scale = max(.001, Math.min(1000, scale))
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
