(function() {
  var Node, PI, acos, asin, atan, bold, canvas, ceil, cos, dist, drawScreen, fontFamily, fontHeight, fontWidth, ga, gr, max, min, minNameWidth, mouseDownAct, mouseMoveAct, mouseUpAct, nameFadeRad, nameFadeWidth, noTypoRad, regular, req, resizeAct, round, sin, sqrt, timer, vp, wheelAct;

  ({PI, sqrt, sin, cos, asin, acos, atan, min, max, round, ceil} = Math);

  dist = function(x, y) {
    return sqrt(x ** 2 + y ** 2);
  };

  // Constants
  fontHeight = 14;

  fontWidth = fontHeight * .75;

  fontFamily = 'Roboto Mono';

  regular = fontHeight + 'px ' + fontFamily;

  bold = 'bold ' + fontHeight + 'px ' + fontFamily;

  minNameWidth = 1 * fontWidth;

  noTypoRad = dist(minNameWidth / 2, fontHeight / 2);

  nameFadeWidth = 2 * fontWidth;

  nameFadeRad = dist(nameFadeWidth / 2, fontHeight / 2);

  // areaLoss = PI / 4 * .5
  gr = (1 + 5 ** .5) / 2;

  ga = PI * 2 / gr ** 2;

  timer = performance.now();

  canvas = document.getElementById('canvas');

  vp = {
    scale: .333,
    rot: -PI / 2,
    offx: 0,
    offy: 0,
    pX: 0,
    pY: 0,
    sep: 1.1,
    fat: 1.1,
    panning: false,
    panx: 0,
    pany: 0,
    panstx: 0,
    pansty: 0,
    minDispRad: 0.01,
    update: function() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      canvas.width = this.width;
      canvas.height = this.height;
      this.min = min(this.width, this.height);
      this.unit = this.min / this.sep / 2 * this.scale;
      this.cx = this.width / 2 + this.offx * this.unit;
      return this.cy = this.height / 2 + this.offy * this.unit;
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

    layout(x1 = 0, y1 = 0, rad = 1, slice = PI, dir1 = 0) {
      var dir, dirDist, dirRad, dirSlice, firstDirDir, i, j, kidDir, len, nDirs, nDist, ref, wishRad, wishSlice;
      this.x = x1;
      this.y = y1;
      this.rad = rad;
      this.slice = slice;
      this.dir = dir1;
      nDist = dist(this.x, this.y);
      if (this.dirs.length > 0) {
        nDirs = this.dirs.length;
        if (nDirs === 1) {
          wishRad = this.rad / vp.sep;
        } else {
          wishRad = sqrt(this.rad ** 2 / nDirs) * vp.fat;
        }
        if (wishRad * vp.scale < vp.minDispRad) {
          this.hideDirs = true;
        } else {
          this.hideDirs = false;
          dirDist = nDist + (this.rad + wishRad) * vp.sep;
          wishSlice = asin(wishRad / dirDist);
          dirSlice = this.slice / nDirs;
          if (wishSlice < dirSlice) {
            dirRad = wishRad;
          } else {
            dirRad = sin(dirSlice) * dirDist;
          }
          if (this.rad !== 1) {
            firstDirDir = this.dir - this.slice + dirSlice;
          } else {
            firstDirDir = vp.rot;
          }
          ref = this.dirs;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            dir = ref[i];
            kidDir = firstDirDir + dirSlice * i * 2;
            dir.layout(cos(kidDir) * dirDist, sin(kidDir) * dirDist, dirRad, dirSlice, kidDir);
          }
        }
      }
      // Fatsy root
      if (this.rad === 1) {
        return this.rad = vp.sep;
      }
    }

    draw(ctx) {
      var d, ddX, ddY, dir, dispRad, dispX, dispY, f, fAreaRad, fDir, fDispWidth, fDist, fX, fY, flagRad, flagSlice, flagStartX, flagStartY, i, inRad, j, k, l, len, len1, len2, lw, nFiles, nx, primScale, ref, ref1, ref2, results, sRad, scale, typoBase;
      // Calculate details
      dispRad = this.rad * vp.unit / vp.sep;
      dispX = vp.cx + this.x * vp.unit;
      dispY = vp.cy + this.y * vp.unit;
      ctx.save();
      // Draw lines
      if (this.dirs.length > 0) {
        if (this.hideDirs) {
          // flagRad = @rad * vp.sep ** 4
          // flagRad = @rad * (1 + .0333 / vp.scale * @rad))
          sRad = this.rad * vp.scale;
          flagRad = this.rad + .02 / vp.scale;
          flagSlice = (PI / 2 + asin(this.rad / vp.sep / dist(this.x, this.y)) - acos(this.rad / vp.sep / flagRad)) / vp.sep;
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
          ref = this.dirs;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            d = ref[i];
            ctx.beginPath();
            ctx.moveTo(dispX, dispY);
            ddX = d.x * vp.unit + vp.cx;
            ddY = d.y * vp.unit + vp.cy;
            ctx.lineTo(ddX, ddY);
            if (i === 0) {
              lw = ctx.lineWidth;
              ctx.lineWidth = lw * 1.333;
              ctx.strokeStyle = '#303030';
              ctx.stroke();
              ctx.lineWidth = lw * .75;
              ctx.strokeStyle = '#606060';
              ctx.stroke();
              ctx.lineWidth = lw;
            } else {
              ctx.stroke();
            }
          }
        }
      }
      // Selection indicator
      if (dist(dispX - vp.pX, dispY - vp.pY) < dispRad) {
        ctx.beginPath();
        ctx.fillStyle = '#c0c0c0';
        ctx.arc(dispX, dispY, dispRad + 5, 0, PI * 2);
        ctx.fill();
      }
      // Body
      ctx.fillStyle = '#404040';
      ctx.beginPath();
      ctx.arc(dispX, dispY, dispRad, 0, PI * 2);
      ctx.fill();
      ctx.clip();
      // Inner circle
      ctx.fillStyle = '#303030';
      ctx.beginPath();
      ctx.arc(dispX, dispY, inRad * vp.unit, 0, PI * 2);
      ctx.fill();
      // Files
      fAreaRad = this.rad / vp.sep ** 1.5;
      inRad = vp.sep - 1;
      nFiles = this.files.length;
      if (nFiles > 0) {
        primScale = 1 / sqrt((1 + nFiles * (1 + inRad)) * gr);
        scale = fAreaRad * primScale * (1 - primScale);
        // fDispRad = scale * vp.unit
        fDispWidth = sqrt(2) * scale * vp.unit;
        ctx.fillStyle = '#606060';
        ref1 = this.files;
        for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
          f = ref1[i];
          fDist = sqrt((1 + (nFiles - i) + nFiles * inRad) * gr) * scale;
          fDir = ga * i - PI / 2;
          // console.log(@name, "scale:", scale, "fDist:", fDist, "fDispRad:", fDispRad)
          fX = (this.x + cos(fDir) * fDist) * vp.unit + vp.cx - fDispWidth / 2;
          fY = (this.y + sin(fDir) * fDist) * vp.unit + vp.cy - fDispWidth / 2;
          ctx.beginPath();
          ctx.fillRect(fX, fY, fDispWidth, fDispWidth);
          // ctx.arc(fX, fY, fDispRad, 0, 2*PI)
          ctx.fill();
        }
      }
      // Name
      ctx.fillStyle = '#c0c0c0';
      if (dispRad > noTypoRad) {
        typoBase = 2 * sqrt(dispRad ** 2 - (fontHeight / 2) ** 2);
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
      // Draw directories
      if (this.dirs.length > 0 && !this.hideDirs) {
        ref2 = this.dirs;
        results = [];
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          dir = ref2[l];
          results.push(dir.draw(ctx));
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
    ctx.fillText(round(1000 / (t - timer)) + " FPS", 50, 50);
    timer = t;
    return ctx.restore();
  };

  resizeAct = function() {
    vp.update();
    return window.requestAnimationFrame(drawScreen);
  };

  wheelAct = function(e) {
    var delta, scale;
    if (e.shiftKey) {
      vp.rot += e.deltaY / 180 / vp.scale ** .5;
    } else {
      delta = e.deltaY * -0.01;
      scale = vp.scale * (1 + delta);
      scale = max(.001, Math.min(1000, scale));
      vp.offx += (vp.width / 2 - e.clientX) * delta * vp.sep ** 2 / vp.unit;
      vp.offy += (vp.height / 2 - e.clientY) * delta * vp.sep ** 2 / vp.unit;
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
    }
    vp.pX = e.clientX;
    vp.pY = e.clientY;
    return window.requestAnimationFrame(drawScreen);
  };

  mouseUpAct = function(e) {
    return vp.panning = false;
  };

  // Init from here on, just like that.
  req = new XMLHttpRequest();

  req.open('GET', 'https://gradient-images.github.io/tgsh/tgsh_tree.json');

  // req.open('GET', 'https://gradient-images.github.io/tgsh/teflon_tree.json')
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
