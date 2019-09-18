(function() {
  var Node, PI, acos, areaLoss, asin, atan, bold, canvas, cos, drawScreen, fontFamily, fontHeight, fontWidth, max, min, minNameWidth, mouseDownAct, mouseMoveAct, mouseUpAct, nameFadeRad, nameFadeWidth, noTypoRad, regular, req, resizeAct, round, sin, sqrt, timer, vp, wheelAct;

  ({PI, sqrt, sin, cos, asin, acos, atan, min, max, round} = Math);

  // Constants
  fontHeight = 14;

  fontWidth = fontHeight * .75;

  fontFamily = 'Roboto Mono';

  regular = fontHeight + 'px ' + fontFamily;

  bold = 'bold ' + fontHeight + 'px ' + fontFamily;

  minNameWidth = 1 * fontWidth;

  noTypoRad = sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  nameFadeWidth = 2 * fontWidth;

  nameFadeRad = sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  areaLoss = PI / 4 * .5;

  // gr = (1 + 5**.5) / 2
  // ga = PI*2 / gr**2
  timer = performance.now();

  canvas = document.getElementById('canvas');

  vp = {
    scale: .333,
    rot: -PI / 2,
    offx: 0,
    offy: 0,
    sep: 1.1,
    fat: 1.1,
    panning: false,
    panx: 0,
    pany: 0,
    panstx: 0,
    pansty: 0,
    minDispRad: 0.01,
    update: function() {
      var h, w;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      this.width = w;
      this.height = h;
      this.min = min(w, h);
      this.unit = this.min / this.sep / 2 * this.scale;
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

    layout(x = 0, y = 0, rad = 1, slice1 = PI, dir1 = 0) {
      var dir, dirDist, dirRad, dirSlice, dist, firstDirDir, i, j, kidDir, len, nDirs, ref, wishRad, wishSlice;
      this.x = x;
      this.y = y;
      this.rad = rad;
      this.slice = slice1;
      this.dir = dir1;
      dist = sqrt(this.x ** 2 + this.y ** 2);
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
          dirDist = dist + (this.rad + wishRad) * vp.sep;
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
      var area, d, ddX, ddY, dir, dispRad, dispX, dispY, f, fDir, fX, fY, fileDispRad, fileDist, flagRad, flagSlice, flagStartX, flagStartY, i, inRad, j, k, l, len, len1, len2, lw, nFiles, nx, ref, ref1, ref2, results, sepRad, slice, typoBase, wishRad;
      // Calculate details
      dispRad = this.rad * vp.unit / vp.sep;
      dispX = vp.cx + this.x * vp.unit;
      dispY = vp.cy + this.y * vp.unit;
      ctx.save();
      // Draw lines
      if (this.dirs.length > 0) {
        if (this.hideDirs) {
          // flagRad = @rad * vp.sep ** 4
          flagRad = this.rad * (1 + .0333 / (vp.scale * this.rad));
          flagSlice = (PI / 2 + asin(this.rad / vp.sep / sqrt(this.x ** 2 + this.y ** 2)) - acos(this.rad / vp.sep / flagRad)) / vp.sep;
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
              ctx.strokeStyle = '#909090';
              ctx.stroke();
              ctx.lineWidth = lw;
              ctx.strokeStyle = '#606060';
            } else {
              ctx.stroke();
            }
          }
        }
      }
      // Body
      ctx.fillStyle = '#202020';
      ctx.beginPath();
      ctx.arc(dispX, dispY, dispRad, 0, PI * 2);
      ctx.fill();
      ctx.clip();
      sepRad = this.rad / vp.sep ** .5;
      ctx.beginPath();
      ctx.fillStyle = '#404040';
      ctx.arc(dispX, dispY, sepRad * vp.unit / vp.sep, 0, PI * 2);
      ctx.fill();
      // Files
      if (this.files.length > 0) {
        inRad = sepRad - (sepRad / vp.sep ** 2);
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.arc(dispX, dispY, inRad * vp.unit, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#606060';
        nFiles = this.files.length;
        slice = PI * 2 / nFiles;
        area = (sepRad ** 2 - inRad ** 2) * PI;
        wishRad = min(sqrt(area * areaLoss / nFiles / PI), (sepRad - inRad) / 2);
        fileDispRad = wishRad / vp.sep * vp.unit;
        fileDist = inRad + (sepRad - inRad) / 2;
        ref1 = this.files;
        // console.log(nFiles, inRad, slice, area, wishRad, fileDist)
        for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
          f = ref1[i];
          fDir = i * slice - PI / 2;
          fX = (this.x + cos(fDir) * fileDist) * vp.unit + vp.cx;
          fY = (this.y + sin(fDir) * fileDist) * vp.unit + vp.cy;
          ctx.beginPath();
          ctx.arc(fX, fY, fileDispRad, 0, 2 * PI);
          ctx.fill();
        }
      }
      // Name
      ctx.fillStyle = '#a0a0a0';
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
    var scale;
    if (e.shiftKey) {
      vp.rot += e.deltaY / 180 / vp.scale ** .5;
    } else {
      scale = vp.scale;
      scale *= 1 + e.deltaY * -0.01;
      scale = max(.001, Math.min(1000, scale));
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
