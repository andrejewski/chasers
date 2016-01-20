
var container = document.getElementById('canvas-container');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var clickControls = document.getElementById('click-controls');

var colors = [
	'rgb(255,0,0)',
	'rgb(0,255,0)',
	'rgb(0,0,255)'
];

var traceColors = colors.map(function(rgb) {
	return 'rgba' + rgb.slice(3, -1) + ', 0.075)';
});

var fleetSize = 40;
var fleets = [[], [], []];

var circleRad = 2 * Math.PI;

function rand(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1));
}

function Chaser(type) {
	this.color = colors[type];
	this.traceColor = traceColors[type];
	this.reset();
}

Chaser.prototype.reset = function() {
	this.size = 1;
	this.posx = rand(0, canvas.width);
	this.posy = rand(0, canvas.height);
	this.orientation = Math.random() * (circleRad + 1);
}

Chaser.prototype.setTarget = function(target) {
	this.target = target;
}

var settings = {
  velocity: -1,
  erase: false,
  trace: true,
};

var turnSpeed = circleRad / 50;
var bodyWidth = 6;
var bodyHeight = 2;

Chaser.prototype.update = function() {
	var target = this.target;
	var orient = this.orientation;

	var dx = target.posx - this.posx;
	var dy = target.posy - this.posy;
	if((dy * dy) + (dx * dx) < (16 * this.target.size)) {
		this.size = Math.min((this.size + 0.5), 2);
		this.target.reset();
	} else {
		var angle = Math.atan2(dy, dx);
		var delta = (angle - orient);
		var delta_abs = Math.abs(delta);

		if(delta_abs > Math.PI) {
			delta = delta_abs - circleRad;
		}

		if(delta) {
			var sign = delta / delta_abs;
			var spin = Math.min(turnSpeed, delta_abs);
			orient += (sign * spin);
		}
		orient %= circleRad;

		this.orientation = orient;
		this.posx += Math.cos(orient) * settings.velocity;
		if(this.posx >= canvas.width) this.posx -= canvas.width;
		if(this.posx <= 0) this.posx += canvas.width;

		this.posy += Math.sin(orient) * settings.velocity;
		if(this.posy >= canvas.height) this.posy -= canvas.height;
		if(this.posy <= 0) this.posy += canvas.height;

	}
}

Chaser.prototype.draw = function(ctx) {
	var width = bodyWidth * this.size;
	var height = bodyHeight * this.size;

	ctx.save();
	ctx.translate(this.posx, this.posy);
	ctx.rotate(this.orientation);
	ctx.fillStyle = this.color;
	ctx.fillRect(-(width / 2), -(height / 2), width, height);

	ctx.restore();

	if(!settings.trace) return;
	ctx.strokeStyle = this.traceColor;
	ctx.beginPath();
	ctx.moveTo(this.posx, this.posy);
	ctx.lineTo(this.target.posx, this.target.posy);
	ctx.closePath();
	ctx.stroke();
}

window.onresize = debounce(function resize() {
	var styles = window.getComputedStyle(container);
	canvas.width = unitless(styles.width);
	canvas.height = unitless(styles.height);
}, 200, true);

function unitless(str) {
	return + str.slice(0, str.length - 2); 
}

function debounce(fn, ms, init) {
	var called = false;
	function tick() {
		if(!called) {
			fn();
			called = true;
		}
		setTimeout(function() {
			fn();
			called = false;
		}, ms);
	}
	if(init) tick();
	return tick;
}

var speedRange = document.getElementById('speed');
speedRange.value = settings.velocity;
speedRange.oninput = function(e) {
  var value = speedRange.value;
  value = Math.min(Math.max(-20, value), 20);
  settings.velocity = value;
}

var eraseCheck = document.getElementById('erase');
eraseCheck.checked = settings.erase;
eraseCheck.onchange = function(e) {
  settings.erase = !!eraseCheck.checked;
}

var traceCheck = document.getElementById('trace');
traceCheck.checked = settings.trace;
traceCheck.onchange = function(e) {
  settings.trace = !!traceCheck.checked;
}

for(var j = 0; j < fleetSize; j++) {
	var r = new Chaser(0);
	var g = new Chaser(1);
	var b = new Chaser(2);

	r.setTarget(g);
	g.setTarget(b);
	b.setTarget(r);

	fleets[0].push(r);
	fleets[1].push(g);
	fleets[2].push(b);
}

window.requestAnimationFrame(function tick() {
	if(settings.velocity) {
		if(settings.erase) {
			ctx.clearRect(0,0, canvas.width, canvas.height);
		}

		for(var j = 0; j < fleetSize; j++) {
			var r = fleets[0][j];
			var g = fleets[1][j];
			var b = fleets[2][j];

			r.update();
			g.update();
			b.update();

			r.draw(ctx);
			g.draw(ctx);
			b.draw(ctx);
		}
	}
	window.requestAnimationFrame(tick);
});

