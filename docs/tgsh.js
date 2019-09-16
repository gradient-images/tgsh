(function() {
  var M, Node, PI, acos, asin, atan, bold, canvas, cos, drawScreen, fontFamily, fontHeight, fontWidth, minNameWidth, mouseDownAct, mouseMoveAct, mouseUpAct, nameFadeRad, nameFadeWidth, noTypoRad, pi2, regular, req, resizeAct, sin, sqrt, timer, vp, wheelAct;

  M = Math;

  ({PI, sqrt, sin, cos, asin, acos, atan} = Math);

  pi2 = PI * 2;

  // Defaults
  fontHeight = 14;

  fontWidth = fontHeight * .75;

  fontFamily = 'Roboto Mono';

  regular = fontHeight + 'px ' + fontFamily;

  bold = 'bold ' + fontHeight + 'px ' + fontFamily;

  minNameWidth = 1 * fontWidth;

  noTypoRad = sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  nameFadeWidth = 2 * fontWidth;

  nameFadeRad = sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  timer = performance.now();

  canvas = document.getElementById('canvas');

  vp = {
    scale: .333,
    rot: -PI / 2,
    offx: 0,
    offy: 0,
    separation: 1.1,
    fat: 1.1,
    panning: false,
    panx: 0,
    pany: 0,
    panstx: 0,
    pansty: 0,
    minDispRad: 0.02,
    update: function() {
      var h, w;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      this.width = w;
      this.height = h;
      this.min = Math.min(w, h);
      this.unit = this.min / this.separation / 2 * this.scale;
      this.cx = w / 2 + this.offx * this.unit;
      return this.cy = h / 2 + this.offy * this.unit;
    }
  };

  Node = class Node {
    constructor(obj) {
      var ctx, i, j, kid, len, nameMeasure, ref;
      this.x = 0;
      this.y = 0;
      this.rad = 1;
      this.hideDirs = false;
      this.name = obj.name;
      ctx = canvas.getContext('2d');
      ctx.font = bold;
      nameMeasure = ctx.measureText(' ' + obj.name);
      this.nameWidth = nameMeasure.width;
      this.files = [];
      this.dirs = [];
      if (obj.contents) {
        ref = obj.contents;
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          kid = ref[i];
          if (kid.type === 'directory') {
            this.dirs.push(new Node(kid));
          } else if (kid.type === 'file') {
            this.files.push(new Node(kid));
          }
        }
      }
    }

    layout(x = 0, y = 0, rad = 1, slice = PI, dir = 0) {
      var dist, firstKidDir, i, kidDir, kidDist, kidRad, kidSlice, nKids, wishRad, wishSlice;
      this.x = x;
      this.y = y;
      this.rad = rad;
      this.slice = slice;
      this.dir = dir;
      dist = Math.sqrt(this.x ** 2 + this.y ** 2);
      if (this.dirs) {
        nKids = this.dirs.length;
        if (nKids === 1) {
          wishRad = this.rad / vp.separation;
        } else {
          wishRad = M.sqrt(this.rad ** 2 / nKids) * vp.fat;
        }
        if (wishRad * vp.scale < vp.minDispRad) {
          this.hideDirs = true;
        } else {
          this.hideDirs = false;
          kidDist = dist + (this.rad + wishRad) * vp.separation;
          wishSlice = M.asin(wishRad / kidDist);
          kidSlice = this.slice / nKids;
          if (wishSlice < kidSlice) {
            kidRad = wishRad;
          } else {
            kidRad = M.sin(kidSlice) * kidDist;
          }
          if (this.rad !== 1) {
            firstKidDir = this.dir - this.slice + kidSlice;
          } else {
            firstKidDir = vp.rot;
          }
          i = 0;
          while (i < nKids) {
            kidDir = firstKidDir + kidSlice * i * 2;
            this.dirs[i].layout(Math.cos(kidDir) * kidDist, Math.sin(kidDir) * kidDist, kidRad, kidSlice, kidDir);
            i++;
          }
        }
      }
      // Fatsy root
      if (this.rad === 1) {
        return this.rad = vp.separation;
      }
    }

    draw(ctx) {
      var dispRad, dispX, dispY, flagRad, flagSlice, flagStartX, flagStartY, i, j, k, kdX, kdY, kid, len, lw, nx, ref, results, typoBase;
      // Calculate details
      dispRad = this.rad * vp.unit / vp.separation;
      dispX = vp.cx + this.x * vp.unit;
      dispY = vp.cy + this.y * vp.unit;
      ctx.save();
      // Draw lines
      if (this.dirs) {
        if (this.hideDirs) {
          // flagRad = @rad * vp.separation ** 4
          flagRad = this.rad * (1 + .0333 / (vp.scale * this.rad));
          flagSlice = (PI / 2 + asin(this.rad / vp.separation / sqrt(this.x ** 2 + this.y ** 2)) - acos(this.rad / vp.separation / flagRad)) / vp.separation;
          flagStartX = flagRad * cos(this.dir - flagSlice) + this.x;
          flagStartY = flagRad * sin(this.dir - flagSlice) + this.y;
          // console.log(flagRad, @slice, flagSlice, flagStartX, flagStartY)
          ctx.beginPath();
          ctx.moveTo(dispX, dispY);
          ctx.lineTo(vp.cx + flagStartX * vp.unit, vp.cy + flagStartY * vp.unit);
          ctx.arc(dispX, dispY, flagRad * vp.unit, this.dir - flagSlice, this.dir + flagSlice);
          ctx.fillStyle = '#a0a0a0';
          ctx.fill();
        } else {
          ctx.lineWidth = dispRad * .15 / this.dirs.length ** .5;
          ctx.strokeStyle = '#606060';
          i = 0;
          while (i < this.dirs.length) {
            k = this.dirs[i];
            ctx.beginPath();
            ctx.moveTo(dispX, dispY);
            kdX = vp.cx + k.x * vp.unit;
            kdY = vp.cy + k.y * vp.unit;
            ctx.lineTo(kdX, kdY);
            if (i === 0) {
              lw = ctx.lineWidth;
              ctx.lineWidth = lw * 1.333;
              ctx.strokeStyle = '#303030';
              ctx.stroke();
              ctx.lineWidth = lw * .75;
              ctx.strokeStyle = '#909090';
              ctx.stroke();
              ctx.lineWidth = lw;
              ctx.strokeStyle = '#606060';
            } else {
              ctx.stroke();
            }
            i++;
          }
        }
      }
      // Body
      ctx.fillStyle = '#202020';
      ctx.beginPath();
      ctx.arc(dispX, dispY, dispRad, 0, pi2);
      ctx.fill();
      ctx.clip();
      // Name
      ctx.fillStyle = '#808080';
      if (dispRad > noTypoRad) {
        typoBase = 2 * Math.sqrt(dispRad ** 2 - (fontHeight / 2) ** 2);
        // Align
        if (typoBase > this.nameWidth) {
          ctx.textAlign = 'center';
          nx = dispX;
        } else {
          ctx.textAlign = 'left';
          nx = dispX - typoBase / 2 + fontWidth / 2;
        }
        if (dispRad > nameFadeRad) {
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = (dispRad - noTypoRad) / (nameFadeRad - noTypoRad);
        }
        ctx.font = bold;
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, nx, dispY);
      }
      ctx.restore();
      if (this.dirs && !this.hideDirs) {
        ref = this.dirs;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          kid = ref[j];
          results.push(kid.draw(ctx));
        }
        return results;
      }
    }

  };

  drawScreen = function() {
    var ctx, t;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, vp.width, vp.height);
    ctx.save();
    vp.root.layout();
    vp.root.draw(ctx);
    t = performance.now();
    ctx.font = regular;
    ctx.textAlign = 'left';
    ctx.fillText(Math.round(1000 / (t - timer)) + " FPS", 50, 50);
    timer = t;
    return ctx.restore();
  };

  resizeAct = function() {
    vp.update();
    return window.requestAnimationFrame(drawScreen);
  };

  wheelAct = function(e) {
    var scale;
    if (e.shiftKey) {
      vp.rot += e.deltaY / 180 / vp.scale ** .5;
    } else {
      scale = vp.scale;
      scale *= 1 + e.deltaY * -0.01;
      scale = Math.max(.001, Math.min(1000, scale));
      vp.scale = scale;
      vp.update();
    }
    return window.requestAnimationFrame(drawScreen);
  };

  mouseDownAct = function(e) {
    console.log("Pressed$ " + e.clientX);
    vp.panx = e.clientX;
    vp.pany = e.clientY;
    vp.panstx = vp.offx;
    vp.pansty = vp.offy;
    return vp.panning = true;
  };

  mouseMoveAct = function(e) {
    if (vp.panning) {
      vp.offx = vp.panstx + (e.clientX - vp.panx) / vp.unit;
      vp.offy = vp.pansty + (e.clientY - vp.pany) / vp.unit;
      vp.update();
      return window.requestAnimationFrame(drawScreen);
    }
  };

  mouseUpAct = function(e) {
    return vp.panning = false;
  };

  // Init from here on, just like that.
  req = new XMLHttpRequest();

  req.open('GET', 'https://gradient-images.github.io/tgsh/tgsh_tree.json');

  req.responseType = 'json';

  req.onload = function() {
    vp.root = new Node(req.response[0]);
    console.log(vp.root);
    if (canvas.getContext) {
      vp.update();
      console.log(vp);
      window.onmousedown = mouseDownAct;
      window.onmouseup = mouseUpAct;
      window.onmousemove = mouseMoveAct;
      window.onresize = resizeAct;
      window.onwheel = wheelAct;
      return window.requestAnimationFrame(drawScreen);
    }
  };

  req.send();

}).call(this);
