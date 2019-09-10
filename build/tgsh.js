(function() {
  var canvas, draw, n, raid, resizeCanvas, timer, vp;

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

  timer = performance.now();

  draw = function() {
    var ctx, t;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, vp.width, vp.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(vp.cx, vp.cy, n.rad * vp.min * vp.fit_ratio / 2 * vp.scale, 0, Math.PI * 2, 0);
    ctx.fill();
    ctx.fillStyle = '#e07030';
    ctx.font = '20px Roboto Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Name', vp.cx, vp.cy);
    t = performance.now();
    ctx.textAlign = 'left';
    ctx.fillText(Math.round(1000 / (t - timer)) + " FPS", 50, 50);
    timer = t;
    ctx.restore();
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
