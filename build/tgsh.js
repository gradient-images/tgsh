(function() {
  var canvas, draw, n, raid, resizeCanvas, vp;

  canvas = document.getElementById('canvas');

  vp = {
    scale: 1,
    fit_ratio: 0.9,
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

  n = {
    rad: 1
  };

  raid = 0;

  draw = function() {
    var ctx;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, vp.width, vp.height);
    ctx.beginPath();
    ctx.arc(vp.cx, vp.cy, n.rad * vp.min * vp.fit_ratio / 2 * vp.scale, 0, Math.PI * 2, 0);
    ctx.fill();
    return raid = window.requestAnimationFrame(draw);
  };

  resizeCanvas = function() {
    window.cancelAnimationFrame(raid);
    vp.update();
    return raid = window.requestAnimationFrame(draw);
  };

  if (canvas.getContext) {
    vp.update();
    window.onresize = resizeCanvas;
    window.requestAnimationFrame(draw);
  }

  // console.log("Finished.")

}).call(this);
