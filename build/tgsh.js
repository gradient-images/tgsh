(function() {
  var Node, bold, canvas, draw, fontFamily, fontHeight, fontWidth, graph, minNameWidth, n, nameFadeRad, nameFadeWidth, noTypoRad, raid, regular, resizeInteract, timer, vp, wheelInteract;

  graph = '{ "name": "Nyulcsapda", "kids": [{ "name": "VFX", "kids": [{ "name": "Sc_1" }] }, { "name": "Grade" }, { "name": "Edit" }, { "name": "In" } ]}';

  fontHeight = 18;

  fontWidth = fontHeight * .75;

  fontFamily = 'Roboto Mono';

  regular = fontHeight + 'px ' + fontFamily;

  bold = 'bold ' + fontHeight + 'px ' + fontFamily;

  minNameWidth = 1 * fontWidth;

  noTypoRad = Math.sqrt((minNameWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  nameFadeWidth = 2 * fontWidth;

  nameFadeRad = Math.sqrt((nameFadeWidth / 2) ** 2 + (fontHeight / 2) ** 2);

  raid = 0;

  timer = performance.now();

  canvas = document.getElementById('canvas');

  vp = {
    scale: 1,
    separation: 0.9,
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
      return this.min = Math.min(w, h);
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
      nameMeasure = ctx.measureText(this.name + ' ');
      this.nameWidth = nameMeasure.width;
      if (obj.kids) {
        obj.kids = (function() {
          var i, len, ref, results;
          ref = obj.kids;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            kid = ref[i];
            results.push(Object.assign(new Node(kid), kid));
          }
          return results;
        })();
      }
    }

    draw(ctx) {
      var dispRad, nx, ny, typoBase;
      // Calculate details
      dispRad = n.rad * vp.min * vp.separation / 2 * vp.scale;
      ctx.save();
      // Outline
      ctx.beginPath();
      ctx.arc(vp.cx, vp.cy, dispRad, 0, Math.PI * 2, 0);
      ctx.fill();
      ctx.clip();
      // Name
      ctx.fillStyle = '#808080';
      if (dispRad > noTypoRad) {
        typoBase = 2 * Math.sqrt(dispRad ** 2 - (fontHeight / 2) ** 2);
        // Align
        if (typoBase > this.nameWidth) {
          ctx.textAlign = 'center';
          nx = vp.cx;
        } else {
          ctx.textAlign = 'left';
          nx = vp.cx - typoBase / 2 + fontWidth / 2;
        }
        if (dispRad > nameFadeRad) {
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = (dispRad - noTypoRad) / (nameFadeRad - noTypoRad);
        }
        ny = vp.cy;
        ctx.font = bold;
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, nx, ny);
        return ctx.restore();
      }
    }

  };

  draw = function() {
    var ctx, t;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, vp.width, vp.height);
    ctx.save();
    n.draw(ctx);
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
    return raid = window.requestAnimationFrame(draw);
  };

  // Init from here on, just like that. See `graph` at the top.
  n = Node.fromJSON(graph);

  console.log(n);

  if (canvas.getContext) {
    vp.update();
    window.onresize = resizeInteract;
    window.onwheel = wheelInteract;
    window.requestAnimationFrame(draw);
  }

  // console.log("Finished.")

}).call(this);
