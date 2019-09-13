(function() {
  var Node, bold, canvas, draw, fontFamily, fontHeight, fontWidth, graph, minNameWidth, nameFadeRad, nameFadeWidth, noTypoRad, pi2, raid, regular, resizeInteract, root, timer, vp, wheelInteract;

  graph = '{ "name": "Nyulcsapda", "kids": [{ "name": "VFX", "kids": [{ "name": "Sc_1" }, { "name": "Sc_2", "kids": [{ "name": "Comp" }, { "name": "Plate" }] }, { "name": "Sc_3" }, { "name": "Sc_4" }, { "name": "Sc_5" }] }, { "name": "Grade" }, { "name": "Asset" }, { "name": "Edit" }, { "name": "Sound" }, { "name": "In" }, { "name": "Out" } ]}';

  fontHeight = 14;

  fontWidth = fontHeight * .75;

  fontFamily = 'Roboto Mono';

  regular = fontHeight + 'px ' + fontFamily;

  bold = 'bold ' + fontHeight + 'px ' + fontFamily;

  minNameWidth = 1 * fontWidth;

  noTypoRad = Math.sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  nameFadeWidth = 2 * fontWidth;

  nameFadeRad = Math.sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  pi2 = Math.PI * 2;

  raid = 0;

  timer = performance.now();

  canvas = document.getElementById('canvas');

  vp = {
    scale: .5,
    separation: 1.1,
    fat: 1.1,
    update: function() {
      var h, w;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      this.width = w;
      this.height = h;
      this.cx = w / 2;
      this.cy = h / 2;
      this.min = Math.min(w, h);
      return this.unit = this.min / this.separation / 2 * this.scale;
    }
  };

  Node = class Node {
    static fromJSON(nodesJSON) {
      var node, obj;
      obj = JSON.parse(nodesJSON);
      return node = Object.assign(new Node(obj), obj);
    }

    constructor(obj) {
      var ctx, kid, nameMeasure;
      this.x = 0;
      this.y = 0;
      this.rad = 1;
      ctx = canvas.getContext('2d');
      ctx.font = bold;
      nameMeasure = ctx.measureText(' ' + obj.name);
      this.nameWidth = nameMeasure.width;
      if (obj.kids) {
        obj.kids = (function() {
          var j, len, ref, results;
          ref = obj.kids;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            kid = ref[j];
            results.push(Object.assign(new Node(kid), kid));
          }
          return results;
        })();
      }
    }

    layout(x = 0, y = 0, rad = 1, slice = Math.PI, dir = 0) {
      var dist, firstKidDir, i, kidDir, kidDist, kidRad, kidSlice, nKids, results, wishRad, wishSlice;
      this.x = x;
      this.y = y;
      this.rad = rad;
      this.slice = slice;
      this.dir = dir;
      dist = Math.sqrt(this.x ** 2 + this.y ** 2);
      if (this.kids) {
        nKids = this.kids.length;
        wishRad = Math.sqrt(this.rad ** 2 / nKids) * vp.fat;
        kidDist = dist + (this.rad + wishRad) * vp.separation;
        wishSlice = Math.asin(wishRad / kidDist);
        kidSlice = this.slice / nKids;
        if (wishSlice < kidSlice) {
          kidRad = wishRad;
        } else {
          kidRad = Math.sin(kidSlice) * kidDist;
        }
        firstKidDir = this.dir - this.slice + kidSlice;
        console.log("firstKidDir: " + firstKidDir);
        i = 0;
        results = [];
        while (i < nKids) {
          kidDir = firstKidDir + kidSlice * i * 2;
          console.log("kidDir: " + kidDir);
          this.kids[i].layout(Math.sin(kidDir) * kidDist, -Math.cos(kidDir) * kidDist, kidRad, kidSlice, kidDir);
          results.push(i++);
        }
        return results;
      }
    }

    // if rad == 1
    //   slice = pi2 / nKids
    //   start = 0
    // else
    //   full = Math.asin(rad / od) * 2
    //   slice = full / nKids
    //   start = -slice * (nKids / 2 - .5)
    //   kidDist = (wishRad * 2 * nKids / vp.separation ) / (full * Math.PI / 2)
    draw(ctx) {
      var dispRad, dispX, dispY, i, j, k, kdX, kdY, kid, len, nx, ref, results, typoBase;
      // Calculate details
      dispRad = this.rad * vp.unit / vp.separation;
      dispX = vp.cx + this.x * vp.unit;
      dispY = vp.cy + this.y * vp.unit;
      ctx.save();
      // Draw lines
      if (this.kids) {
        ctx.lineWidth = dispRad / 25;
        ctx.strokeStyle = '#606060';
        i = 0;
        while (i < this.kids.length) {
          k = this.kids[i];
          ctx.beginPath();
          ctx.moveTo(dispX, dispY);
          kdX = vp.cx + k.x * vp.unit;
          kdY = vp.cy + k.y * vp.unit;
          ctx.lineTo(kdX, kdY);
          ctx.stroke();
          i++;
        }
      }
      // Outline
      ctx.fillStyle = '#202020';
      ctx.beginPath();
      ctx.arc(dispX, dispY, dispRad, 0, pi2, 0);
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
      if (this.kids) {
        ref = this.kids;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          kid = ref[j];
          results.push(kid.draw(ctx));
        }
        return results;
      }
    }

  };

  draw = function() {
    var ctx, t;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, vp.width, vp.height);
    ctx.save();
    root.layout();
    root.draw(ctx);
    t = performance.now();
    ctx.font = regular;
    ctx.textAlign = 'left';
    ctx.fillText(Math.round(1000 / (t - timer)) + " FPS", 50, 50);
    timer = t;
    return ctx.restore();
  };

  resizeInteract = function() {
    vp.update();
    return raid = window.requestAnimationFrame(draw);
  };

  wheelInteract = function(event) {
    var scale;
    scale = vp.scale;
    scale *= 1 + event.deltaY * -0.01;
    scale = Math.max(.01, Math.min(4, scale));
    vp.scale = scale;
    vp.update();
    return raid = window.requestAnimationFrame(draw);
  };

  // Init from here on, just like that. See `graph` at the top.
  root = Node.fromJSON(graph);

  console.log(root);

  if (canvas.getContext) {
    vp.update();
    window.onresize = resizeInteract;
    window.onwheel = wheelInteract;
    window.requestAnimationFrame(draw);
  }

  // console.log("Finished.")

}).call(this);
