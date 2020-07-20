(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const vector_1 = __importDefault(require("./vector"));
const utils_1 = require("./utils");
class Block {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    static fromSize(pos, size) {
        return new Block(pos, pos.c().add(size));
    }
    getCorner(v) {
        return new vector_1.default(utils_1.lerp(this.min.x, this.max.x, v.x), utils_1.lerp(this.min.y, this.max.y, v.y));
    }
    getCorner0Centered(v) {
        return this.getCorner(v);
    }
    center() {
        return this.getCorner(new vector_1.default(0.5, 0.5));
    }
    set(v, corner) {
        var displacement = this.getCorner(corner).to(v);
        return this.move(displacement);
    }
    move(v) {
        this.min.add(v);
        this.max.add(v);
        return this;
    }
    size() {
        return this.min.to(this.max);
    }
    draw(ctxt) {
        var size = this.size();
        utils_1.fillRect(ctxt, this.min, size);
    }
    c() {
        return new Block(this.min.c(), this.max.c());
    }
    clamp(v) {
        return v.map((val, arr, i) => utils_1.clamp(val, this.min.vals[i], this.max.vals[i]));
    }
    intersectVector(v) {
        return utils_1.inRange(this.min.x, this.max.x, v.x) && utils_1.inRange(this.min.y, this.max.y, v.y);
    }
}
exports.Block = Block;
},{"./utils":6,"./vector":7}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const block_1 = require("./block");
const vector_1 = __importDefault(require("./vector"));
const utils_1 = require("./utils");
class Camera {
    constructor(ctxt, focus, screensize) {
        this.ctxt = ctxt;
        this.focus = focus;
        this.screensize = screensize;
        this.screenshakeAnim = new utils_1.Anim();
        this.wobbles = 0;
        this.wobbleamount = 0;
        this.pos = focus.block.center();
        // this.offset = this.screensize.c().scale(0.5).scale(-1)
        // var halfsize = this.screensize.c().scale(0.5)
        var slacksize = new vector_1.default(100, 110);
        // this.deadZone = new Block(halfsize.c().sub(slacksize), halfsize.c().add(slacksize))
        this.deadZone = new block_1.Block(slacksize.c().scale(-1), slacksize);
        this.screenshakeAnim.animType = utils_1.AnimType.once;
        this.screenshakeAnim.begin = 0;
        this.screenshakeAnim.end = 1;
    }
    update() {
        var target = this.focus.block.center();
        // target.add(this.focus.vel.c().sign().scale(50))
        target.add(this.focus.vel.c().scale(0.2));
        this.target = target;
        var pos2target = this.pos.to(target);
        var clampedp2t = this.deadZone.clamp(pos2target.c());
        this.pos.add(clampedp2t.to(pos2target));
        var screenshakeoffset = new vector_1.default(0, 0);
        screenshakeoffset.y = Math.sin(this.screenshakeAnim.get() * this.wobbles) * this.wobbleamount;
        this.setCamera(this.pos.c().add(screenshakeoffset));
    }
    screenshake(duration, wobbles, wobbleamount) {
        this.wobbles = wobbles;
        this.wobbleamount = wobbleamount;
        this.screenshakeAnim.stopwatch.start();
        this.screenshakeAnim.duration = duration;
        this.screenshakeAnim.begin = 0;
        this.screenshakeAnim.end = utils_1.TAU;
    }
    setCamera(pos) {
        this.ctxt.resetTransform();
        pos.sub(this.screensize.c().scale(0.5));
        this.ctxt.translate(utils_1.round(-pos.x), utils_1.round(-pos.y));
    }
    debugdraw(ctxt) {
        ctxt.strokeStyle = 'black';
        utils_1.strokeRect(ctxt, this.pos.c().add(this.deadZone.min), this.deadZone.size());
        ctxt.fillStyle = 'red';
        this.target.draw(ctxt);
    }
}
exports.default = Camera;
},{"./block":1,"./utils":6,"./vector":7}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSystem = exports.PEvent = exports.Box = void 0;
class Box {
    constructor(value) {
        this.value = value;
        this.beforeChange = new EventSystem();
        this.afterChange = new EventSystem();
    }
    get() {
        return this.value;
    }
    set(val) {
        if (val != this.value) {
            this.beforeChange.trigger(this.value);
            this.value = val;
            this.afterChange.trigger(this.value);
        }
    }
}
exports.Box = Box;
class PEvent {
    constructor(value) {
        this.value = value;
        this.cbset = new Set();
        this.handled = false;
    }
}
exports.PEvent = PEvent;
class EventSystem {
    constructor() {
        this.listeners = [];
    }
    listen(cb) {
        this.listeners.push(cb);
    }
    trigger(val) {
        this.continue(new PEvent(val));
    }
    continue(e) {
        for (var cb of this.listeners) {
            if (e.cbset.has(cb) == false) {
                e.cbset.add(cb);
                cb(e.value, e);
                if (e.handled) {
                    break;
                }
            }
        }
    }
}
exports.EventSystem = EventSystem;
},{}],4:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const world_1 = require("./world");
const platformController_1 = require("./platformController");
const vector_1 = __importDefault(require("./vector"));
const block_1 = require("./block");
const camera_1 = __importDefault(require("./camera"));
var x = window;
x.keys = utils_1.keys;
// keys['d'] = true
var grid = [
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1],
];
var gridsize = new vector_1.default(grid[0].length, grid.length);
var world = new world_1.World(gridsize, 40);
world.grid = grid;
var platformController = new platformController_1.PlatformController(new world_1.Entity(block_1.Block.fromSize(new vector_1.default(world.tilesize, world.tilesize).mul(new vector_1.default(8, 12)), new vector_1.default(40, 40))), world);
// var topdownController = new TopDownController(new Entity(Block.fromSize(new Vector(world.tilesize,world.tilesize).mul(new Vector(12,12)), new Vector(40,40))),world)
var screensize = gridsize.c().scale(world.tilesize); //800 720
var { canvas, ctxt } = utils_1.createCanvas(screensize.x, screensize.y);
// platformController.body.block.set(new Vector(40,40),new Vector(0,0))
// platformController.body.speed = new Vector(0,100)
var camera = new camera_1.default(ctxt, platformController.body, screensize);
x.platformController = platformController;
utils_1.loop((dt) => {
    if (utils_1.keys['p']) {
        // keys['p'] = false
        // debugger
        camera.screenshake(1000, 8, 20);
    }
    ctxt.resetTransform();
    ctxt.clearRect(0, 0, screensize.x, screensize.y);
    dt = utils_1.clamp(dt, 0.005, 0.1);
    world.update(dt); //body gets moved
    camera.update();
    world.debugDrawGrid(ctxt); //body gets drawn
    camera.debugdraw(ctxt);
    world.debugDrawRays(ctxt);
    world.emptyFiredRays();
});
},{"./block":1,"./camera":2,"./platformController":5,"./utils":6,"./vector":7,"./world":8}],5:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformController = void 0;
const world_1 = require("./world");
const vector_1 = __importDefault(require("./vector"));
const utils_1 = require("./utils");
class PlatformController {
    constructor(body, world) {
        this.body = body;
        this.world = world;
        this.gravity = new vector_1.default(0, 800);
        this.jumpspeed = 400;
        this.accforce = 3000;
        this.passiveStopForce = 3000;
        this.airaccforce = 1000;
        this.airpassiveStopForce = 350;
        this.jumpMaxAmmo = 1;
        this.jumpAmmo = this.jumpMaxAmmo;
        this.climbforce = 2000;
        this.wallhangResetsJumpAmmo = true;
        this.coyotetime = 0.3;
        this.coyotetimer = this.coyotetime;
        world.entities.push(body);
        world.beforeUpdate.listen((dt) => {
            var input = utils_1.get2DMoveInputYflipped();
            this.body.vel.add(this.gravity.c().scale(dt));
            if (utils_1.keys['w'] && this.body.grounded.y == 1) {
                this.jump();
            }
            //move
            if (input.x != 0) {
                var accForce = this.body.grounded.y == 0 ? this.airaccforce : this.accforce;
                this.body.vel.x += input.x * accForce * dt;
                var hanging = this.isHanging();
                if (hanging != 0 && this.body.vel.y > 0) {
                    world_1.applyStoppingForce(this.body.vel, new vector_1.default(0, this.climbforce * dt));
                }
            }
            //passive stop
            if (input.x == 0) {
                var stopstrength = this.body.grounded.y == 0 ? this.airpassiveStopForce : this.passiveStopForce;
                world_1.applyStoppingForce(this.body.vel, new vector_1.default(stopstrength * dt, 0));
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.repeat || this.body.grounded.y == 1) { //ground jumps are done by polling in update
                return;
            }
            if (e.key == ' ' || e.key == 'w') {
                this.jump();
            }
        });
        world.afterUpdate.listen((dt) => {
            if (this.body.grounded.y == 1) {
                this.jumpAmmo = this.jumpMaxAmmo;
            }
            if (this.body.grounded.x != 0 && this.wallhangResetsJumpAmmo) {
                this.jumpAmmo = this.jumpMaxAmmo;
            }
            this.coyotetimer -= dt;
            if (this.body.grounded.y == 1) {
                this.coyotetimer = this.coyotetime;
            }
        });
    }
    jump() {
        var hanging = this.isHanging();
        var jump = () => {
            if (hanging != 0 && this.body.grounded.y == 0) {
                this.body.vel = new vector_1.default(-hanging, -1).normalize().scale(this.jumpspeed);
            }
            else {
                this.body.vel.y = -this.jumpspeed;
            }
        };
        if (hanging != 0 || this.body.grounded.y == 1 || this.coyotetimer > 0) {
            jump();
            this.coyotetimer = 0;
        }
        else if (this.jumpAmmo > 0) {
            jump();
            this.jumpAmmo--;
        }
    }
    isHanging() {
        var hanging = 0;
        if (this.world.boxCast(this.body.block, 0, 0.01).hit) {
            hanging = 1;
        }
        else if (this.world.boxCast(this.body.block, 0, -0.01).hit) {
            hanging = -1;
        }
        return hanging;
    }
}
exports.PlatformController = PlatformController;
},{"./utils":6,"./vector":7,"./world":8}],6:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anim = exports.AnimType = exports.StopWatch = exports.mod = exports.max = exports.min = exports.random = exports.round = exports.ceil = exports.floor = exports.lengthen = exports.clamp = exports.createCanvas = exports.gen2Darray = exports.line = exports.strokeRect = exports.fillRect = exports.swap = exports.lerp = exports.to = exports.inverseLerp = exports.map = exports.inRange = exports.get2DMoveInputYflipped = exports.findbest = exports.findbestIndex = exports.loop = exports.TAU = exports.keys = void 0;
const vector_1 = __importDefault(require("./vector"));
var lastUpdate = Date.now();
var TAU = Math.PI * 2;
exports.TAU = TAU;
function loop(callback) {
    var now = Date.now();
    callback((now - lastUpdate) / 1000);
    lastUpdate = now;
    requestAnimationFrame(() => {
        loop(callback);
    });
}
exports.loop = loop;
function findbestIndex(list, evaluator) {
    if (list.length < 1) {
        return -1;
    }
    var bestIndex = 0;
    var bestscore = evaluator(list[0]);
    for (var i = 1; i < list.length; i++) {
        var score = evaluator(list[i]);
        if (score > bestscore) {
            bestscore = score;
            bestIndex = i;
        }
    }
    return bestIndex;
}
exports.findbestIndex = findbestIndex;
function findbest(list, evaluator) {
    return list[findbestIndex(list, evaluator)];
}
exports.findbest = findbest;
var keys = {};
exports.keys = keys;
document.addEventListener('keydown', e => {
    keys[e.key] = true;
});
document.addEventListener('keyup', e => {
    keys[e.key] = false;
});
function get2DMoveInputYflipped() {
    var res = new vector_1.default(0, 0);
    if (keys['w']) {
        res.y--;
    }
    if (keys['s']) {
        res.y++;
    }
    if (keys['a']) {
        res.x--;
    }
    if (keys['d']) {
        res.x++;
    }
    return res;
}
exports.get2DMoveInputYflipped = get2DMoveInputYflipped;
function inRange(min, max, v) {
    return v >= min && v <= max;
}
exports.inRange = inRange;
function map(val, from1, from2, to1, to2) {
    return lerp(to1, to2, inverseLerp(val, from1, from2));
}
exports.map = map;
function inverseLerp(val, a, b) {
    return to(a, val) / to(a, b);
}
exports.inverseLerp = inverseLerp;
function to(a, b) {
    return b - a;
}
exports.to = to;
function lerp(a, b, t) {
    return a + to(a, b) * t;
}
exports.lerp = lerp;
function swap(arr, a, b) {
    var temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
}
exports.swap = swap;
function fillRect(ctxt, pos, size) {
    ctxt.fillRect(round(pos.x), round(pos.y), size.x, size.y);
}
exports.fillRect = fillRect;
function strokeRect(ctxt, pos, size) {
    ctxt.strokeRect(round(pos.x) + 0.5, round(pos.y) + 0.5, size.x, size.y);
}
exports.strokeRect = strokeRect;
function line(ctxt, origin, destination) {
    ctxt.beginPath();
    var dir = origin.to(destination).normalize().scale(0.5);
    ctxt.moveTo(Math.round(origin.x) + 0.5 - dir.x, Math.round(origin.y) + 0.5 - dir.y);
    ctxt.lineTo(Math.round(destination.x) + 0.5 - dir.x, Math.round(destination.y) + 0.5 - dir.y);
    ctxt.stroke();
}
exports.line = line;
function gen2Darray(size, cb) {
    var res = [];
    var index = new vector_1.default(0, 0);
    for (index.y = 0; index.y < size.y; index.y++) {
        var row = [];
        res.push(row);
        for (index.x = 0; index.x < size.x; index.x++) {
            row.push(cb(index));
        }
    }
    return res;
}
exports.gen2Darray = gen2Darray;
function createCanvas(x, y) {
    var canvas = document.createElement('canvas');
    canvas.width = x;
    canvas.height = y;
    document.body.appendChild(canvas);
    var ctxt = canvas.getContext('2d');
    return { ctxt: ctxt, canvas: canvas };
}
exports.createCanvas = createCanvas;
function clamp(val, min, max) {
    return Math.max(Math.min(val, max), min);
}
exports.clamp = clamp;
function lengthen(val, amount) {
    return val + amount * Math.sign(val);
}
exports.lengthen = lengthen;
function floor(val) {
    return Math.floor(val);
}
exports.floor = floor;
function ceil(val) {
    return Math.ceil(val);
}
exports.ceil = ceil;
function round(val) {
    return Math.round(val);
}
exports.round = round;
function random() {
    return Math.random();
}
exports.random = random;
function min(a, b) {
    return Math.min(a, b);
}
exports.min = min;
function max(a, b) {
    return Math.max(a, b);
}
exports.max = max;
function mod(number, modulus) {
    return ((number % modulus) + modulus) % modulus;
}
exports.mod = mod;
class StopWatch {
    constructor() {
        this.starttimestamp = Date.now();
        this.pausetimestamp = Date.now();
        this.pausetime = 0;
        this.paused = true;
    }
    get() {
        var currentamountpaused = 0;
        if (this.paused) {
            currentamountpaused = to(this.pausetimestamp, Date.now());
        }
        return to(this.starttimestamp, Date.now()) - (this.pausetime + currentamountpaused);
    }
    start() {
        this.paused = false;
        this.starttimestamp = Date.now();
        this.pausetime = 0;
    }
    continue() {
        if (this.paused) {
            this.paused = false;
            this.pausetime += to(this.pausetimestamp, Date.now());
        }
    }
    pause() {
        if (this.paused == false) {
            this.paused = true;
            this.pausetimestamp = Date.now();
        }
    }
    reset() {
        this.paused = true;
        this.starttimestamp = Date.now();
        this.pausetimestamp = Date.now();
        this.pausetime = 0;
    }
}
exports.StopWatch = StopWatch;
var AnimType;
(function (AnimType) {
    AnimType[AnimType["once"] = 0] = "once";
    AnimType[AnimType["repeat"] = 1] = "repeat";
    AnimType[AnimType["pingpong"] = 2] = "pingpong";
    AnimType[AnimType["extend"] = 3] = "extend";
})(AnimType = exports.AnimType || (exports.AnimType = {}));
class Anim {
    constructor() {
        this.animType = AnimType.once;
        this.reverse = false;
        this.duration = 1000;
        this.stopwatch = new StopWatch();
        this.begin = 0;
        this.end = 1;
    }
    get() {
        var cycles = this.stopwatch.get() / this.duration;
        switch (this.animType) {
            case AnimType.once:
                return clamp(lerp(this.begin, this.end, cycles), this.begin, this.end);
            case AnimType.repeat:
                return lerp(this.begin, this.end, mod(cycles, 1));
            case AnimType.pingpong:
                var pingpongcycle = mod(cycles, 2);
                if (pingpongcycle <= 1) {
                    return lerp(this.begin, this.end, pingpongcycle);
                }
                else {
                    return lerp(this.end, this.begin, pingpongcycle - 1);
                }
            case AnimType.extend:
                var distPerCycle = to(this.begin, this.end);
                return Math.floor(cycles) * distPerCycle + lerp(this.begin, this.end, mod(cycles, 1));
        }
    }
}
exports.Anim = Anim;
},{"./vector":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zero = void 0;
const utils_1 = require("./utils");
class Vector {
    constructor(x, y, z = 0) {
        this.vals = [];
        this.vals[0] = x;
        this.vals[1] = y;
        this.vals[2] = z;
    }
    add(v) {
        return this.map((val, arr, i) => val + v.vals[i]);
    }
    sub(v) {
        return this.map((val, arr, i) => val - v.vals[i]);
    }
    mul(v) {
        return this.map((val, arr, i) => val * v.vals[i]);
    }
    div(v) {
        return this.map((val, arr, i) => val / v.vals[i]);
    }
    scale(v) {
        return this.map((val, arr, i) => val * v);
    }
    to(v) {
        return v.c().sub(this);
    }
    floor() {
        return this.map((val, arr, i) => Math.floor(val));
    }
    ceil() {
        return this.map((val, arr, i) => Math.ceil(val));
    }
    sign() {
        return this.map((val, arr, i) => Math.sign(val));
    }
    lerp(v, t) {
        return this.c().add(this.to(v).scale(t));
    }
    lengthsq() {
        var sum = 0;
        for (var i = 0; i < this.vals.length; i++) {
            sum += this.vals[i] * this.vals[i];
        }
        return sum;
    }
    length() {
        return Math.pow(this.lengthsq(), 0.5);
    }
    normalize() {
        var length = this.length();
        if (length == 0) {
            return this.scale(0);
        }
        else {
            return this.scale(1 / length);
        }
    }
    c() {
        return new Vector(0, 0).overwrite(this);
    }
    overwrite(v) {
        return this.map((val, arr, i) => v.vals[i]);
    }
    dot(v) {
        var sum = 0;
        for (var i = 0; i < this.vals.length; i++) {
            sum += this.vals[i] * v.vals[i];
        }
        return sum;
    }
    get(i) {
        return this.vals[i];
    }
    set(i, val) {
        this.vals[i] = val;
    }
    cross(v) {
        var x = this.y * v.z - this.z * v.y;
        var y = this.z * v.x - this.x * v.z;
        var z = this.x * v.y - this.y * v.x;
        return new Vector(x, y, z);
    }
    projectOnto(v) {
        return v.c().scale(this.dot(v) / v.dot(v));
    }
    loop2d(cb) {
        var counter = new Vector(0, 0);
        for (counter.x = 0; counter.x < this.x; counter.x++) {
            for (counter.y = 0; counter.y < this.y; counter.y++) {
                cb(counter);
            }
        }
    }
    rotate2d(rotations, origin = new Vector(0, 0)) {
        return this;
    }
    draw(ctxt) {
        var width = 10;
        var hw = width / 2;
        ctxt.fillRect(utils_1.round(this.x - hw), utils_1.round(this.y - hw), width, width);
        return this;
    }
    map(cb) {
        for (var i = 0; i < this.vals.length; i++) {
            this.vals[i] = cb(this.vals[i], this.vals, i);
        }
        return this;
    }
    get x() {
        return this.vals[0];
    }
    get y() {
        return this.vals[1];
    }
    get z() {
        return this.vals[2];
    }
    set x(val) {
        this.vals[0] = val;
    }
    set y(val) {
        this.vals[1] = val;
    }
    set z(val) {
        this.vals[2] = val;
    }
}
exports.default = Vector;
exports.zero = new Vector(0, 0);
},{"./utils":6}],8:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTowards = exports.applyStoppingForce = exports.World = exports.RaycastHit = exports.BoxcastHit = exports.Entity = void 0;
const vector_1 = __importDefault(require("./vector"));
const utils_1 = require("./utils");
const eventsystem_1 = require("./eventsystem");
const block_1 = require("./block");
class Entity {
    constructor(block) {
        this.block = block;
        this.grounded = new vector_1.default(0, 0);
        this.vel = new vector_1.default(0, 0);
        this.minspeed = new vector_1.default(-300, -600);
        this.maxspeed = new vector_1.default(300, 600);
        this.dir = new vector_1.default(1, 0);
    }
}
exports.Entity = Entity;
class BoxcastHit {
    constructor(rays, hit, hitray) {
        this.rays = rays;
        this.hit = hit;
        this.hitray = hitray;
    }
}
exports.BoxcastHit = BoxcastHit;
class RaycastHit {
    constructor(hit, origin, dir, hitLocation, relHitLocation, normal, hitIndex) {
        this.hit = hit;
        this.origin = origin;
        this.dir = dir;
        this.hitLocation = hitLocation;
        this.relHitLocation = relHitLocation;
        this.normal = normal;
        this.hitIndex = hitIndex;
    }
}
exports.RaycastHit = RaycastHit;
class World {
    constructor(gridsize, tilesize) {
        this.gridsize = gridsize;
        this.tilesize = tilesize;
        this.grid = [];
        this.entities = [];
        this.firedRays = [];
        this.beforeUpdate = new eventsystem_1.EventSystem();
        this.afterUpdate = new eventsystem_1.EventSystem();
        this.skinwidth = 0.01;
        this.grid = utils_1.gen2Darray(gridsize, () => 0);
    }
    update(dtseconds) {
        this.beforeUpdate.trigger(dtseconds);
        for (var entity of this.entities) {
            var speed = entity.vel.c().scale(dtseconds);
            //clamp speed
            entity.vel.map((val, arr, i) => {
                return utils_1.clamp(val, entity.minspeed.get(i), entity.maxspeed.get(i));
            });
            this.move(entity, speed);
            if (speed.lengthsq() > 0) {
                entity.dir = speed.c().normalize();
            }
        }
        this.afterUpdate.trigger(dtseconds);
    }
    move(entity, amount) {
        this.moveAxis(entity, 0, amount.x);
        this.moveAxis(entity, 1, amount.y);
    }
    moveAxis(entity, axis, amount) {
        if (amount == 0) {
            return;
        }
        var hit = this.boxCast(entity.block, axis, amount);
        entity.block.move(hit.hitray.relHitLocation);
        entity.grounded.vals[axis] = (hit.hit ? 1 : 0) * Math.sign(amount);
        if (hit.hit) {
            entity.vel.vals[axis] = 0;
        }
    }
    boxCast(block, axis, amount, _skinwidth = this.skinwidth) {
        var dir = VFromAxisAmount(axis, amount);
        if (amount == 0) {
            var dut = new RaycastHit(false, block.center(), dir, null, new vector_1.default(0, 0), null, null);
            return new BoxcastHit([dut], false, dut);
        }
        var skinblock = block.c();
        skinblock.min.add(new vector_1.default(_skinwidth, _skinwidth));
        skinblock.max.sub(new vector_1.default(_skinwidth, _skinwidth));
        var points = this.getPointsOnEdge(skinblock, dir);
        var rays = points.map(point => this.raycastAxisAligned(point, axis, utils_1.lengthen(amount, _skinwidth)));
        var hitray = utils_1.findbest(rays.filter(ray => ray.hit), ray => -ray.relHitLocation.length());
        for (var ray of rays) {
            ray.relHitLocation.vals[axis] = utils_1.lengthen(ray.relHitLocation.vals[axis], -_skinwidth);
            this.firedRays.push(ray);
        }
        return new BoxcastHit(rays, hitray?.hit ?? false, hitray ?? rays[0]);
    }
    raycastAxisAligned(originWorld, axis, amount) {
        var dirWorld = VFromAxisAmount(axis, amount);
        var end = originWorld.c().add(dirWorld);
        var boxes2check = utils_1.ceil(Math.abs(amount) / this.tilesize);
        for (var i = 0; i <= boxes2check; i++) {
            var pos = originWorld.lerp(end, i / boxes2check);
            if (this.isBlocked(pos)) {
                var raycast = this.rayCast(originWorld, dirWorld, this.getBlock(pos));
                raycast.hitIndex = this.world2index(pos);
                return raycast;
            }
        }
        return new RaycastHit(false, originWorld, dirWorld, originWorld.c().add(dirWorld), dirWorld.c(), dirWorld.c().normalize().scale(-1), null);
    }
    rayCast(origin, dir, block) {
        var end = origin.c().add(dir);
        var res = new RaycastHit(false, origin, dir, null, null, null, null);
        var out = [0, 0];
        res.hit = collideLine(origin, origin.c().add(dir), block, out);
        res.hitLocation = origin.lerp(end, out[0]);
        res.relHitLocation = origin.to(res.hitLocation);
        return res;
    }
    getPointsOnEdge(box, dir) {
        var res = [];
        var corners = [
            box.getCorner(new vector_1.default(0, 0)),
            box.getCorner(new vector_1.default(1, 0)),
            box.getCorner(new vector_1.default(1, 1)),
            box.getCorner(new vector_1.default(0, 1)),
        ];
        corners = corners.filter(corner => box.center().to(corner).normalize().dot(dir.c().normalize()) > 0);
        var start = corners[0];
        var end = corners[1];
        var nofpoints = utils_1.ceil(start.to(end).length() / this.tilesize) + 1;
        for (var i = 0; i < nofpoints; i++) {
            res.push(start.lerp(end, (i / (nofpoints - 1))));
        }
        return res;
    }
    emptyFiredRays() {
        this.firedRays = [];
    }
    isBlocked(world) {
        var index = this.world2index(world);
        if (utils_1.inRange(0, this.gridsize.x - 1, index.x) && utils_1.inRange(0, this.gridsize.y - 1, index.y)) {
            return this.grid[index.y][index.x];
        }
        return false;
    }
    isBlockedIndex(index) {
        return this.grid[index.y][index.x];
    }
    getBlock(world) {
        var topleft = this.world2index(world).scale(this.tilesize);
        return block_1.Block.fromSize(topleft, new vector_1.default(this.tilesize, this.tilesize));
    }
    world2index(world) {
        return world.c().div(new vector_1.default(this.tilesize, this.tilesize)).floor();
    }
    index2world(index) {
        return index.c().scale(this.tilesize);
    }
    debugDrawGrid(ctxt) {
        ctxt.fillStyle = 'black';
        this.gridsize.loop2d(i => {
            if (this.isBlockedIndex(i)) {
                this.getBlock(this.index2world(i)).draw(ctxt);
            }
        });
        ctxt.fillStyle = 'grey';
        for (var entity of this.entities) {
            entity.block.draw(ctxt);
        }
    }
    debugDrawRays(ctxt) {
        for (var ray of this.firedRays) {
            if (ray.hit) {
                ctxt.strokeStyle = 'red';
            }
            else {
                ctxt.strokeStyle = 'blue';
            }
            var dir = ray.dir.c().normalize();
            utils_1.line(ctxt, ray.origin, ray.origin.c().add(dir.scale(10)));
        }
    }
}
exports.World = World;
function VFromAxisAmount(axis, amount) {
    var v = new vector_1.default(0, 0);
    v.vals[axis] = amount;
    return v;
}
function collideLine(a, b, box, out) {
    var clip1 = [0, 0];
    var clip2 = [0, 0];
    relIntersect(a.x, b.x, box.min.x, box.max.x, clip1);
    relIntersect(a.y, b.y, box.min.y, box.max.y, clip2);
    //result contains if the lines intersected
    var result = intersectLine(clip1[0], clip1[1], clip2[0], clip2[1], out);
    return result && utils_1.inRange(0, 1, out[0]); // && inRange(0,1,out[1])
}
function relIntersect(amin, amax, bmin, bmax, out) {
    if (amin == amax) { //this could use some work
        out[0] = -Infinity;
        out[1] = Infinity;
        return;
    }
    var length = Math.abs(utils_1.to(amin, amax));
    out[0] = Math.abs(utils_1.to(amin, bmin)) / length;
    out[1] = Math.abs(utils_1.to(amin, bmax)) / length;
    if (out[0] > out[1]) {
        utils_1.swap(out, 0, 1);
    }
}
function intersectLine(amin, amax, bmin, bmax, out) {
    var ibegin = Math.max(amin, bmin);
    var iend = Math.min(amax, bmax);
    out[0] = ibegin;
    out[1] = iend;
    if (ibegin <= iend) {
        return true;
    }
    else {
        return false;
    }
}
function applyStoppingForce(vel, dtforce) {
    vel.x = moveTowards(vel.x, 0, dtforce.x);
    vel.y = moveTowards(vel.y, 0, dtforce.y);
}
exports.applyStoppingForce = applyStoppingForce;
function moveTowards(cur, destination, maxamount) {
    var dir = utils_1.to(cur, destination);
    if (Math.abs(dir) <= maxamount) {
        return destination;
    }
    else {
        return cur + Math.sign(dir) * maxamount;
    }
}
exports.moveTowards = moveTowards;
},{"./block":1,"./eventsystem":3,"./utils":6,"./vector":7}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJibG9jay50cyIsImNhbWVyYS50cyIsImV2ZW50c3lzdGVtLnRzIiwibWFpbi50cyIsInBsYXRmb3JtQ29udHJvbGxlci50cyIsInV0aWxzLnRzIiwidmVjdG9yLnRzIiwid29ybGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxzREFBNkI7QUFDN0IsbUNBQXdEO0FBRXhELE1BQWEsS0FBSztJQUNkLFlBQW1CLEdBQVUsRUFBUyxHQUFVO1FBQTdCLFFBQUcsR0FBSCxHQUFHLENBQU87UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUFPO0lBRWhELENBQUM7SUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQVUsRUFBQyxJQUFXO1FBQ2xDLE9BQU8sSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsU0FBUyxDQUFDLENBQVE7UUFDZCxPQUFPLElBQUksZ0JBQU0sQ0FDYixZQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUMvQixZQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNsQyxDQUFBO0lBQ0wsQ0FBQztJQUVELGtCQUFrQixDQUFDLENBQVE7UUFDdkIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzVCLENBQUM7SUFFRCxNQUFNO1FBQ0YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0JBQU0sQ0FBQyxHQUFHLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUM5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LEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxD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WUFBWSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1FBRHZCLFNBQUksR0FBWSxFQUFFLENBQUE7UUFFZCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNwQixDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsS0FBSyxDQUFDLENBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBUTtRQUNQLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBRUQsS0FBSztRQUNELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFDbkQsQ0FBQztJQUVELElBQUk7UUFDQSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQ2xELENBQUM7SUFFRCxJQUFJO1FBQ0EsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUNsRCxDQUFDO0lBRUQsSUFBSSxDQUFDLENBQVEsRUFBQyxDQUFRO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzVDLENBQUM7SUFFRCxRQUFRO1FBQ0osSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1osS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFDO1lBQ3JDLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFD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QUFDLEdBQVUsRUFBQyxXQUFrQixFQUFDLFNBQWdCO0lBQ3RFLElBQUksR0FBRyxHQUFHLFVBQUUsQ0FBQyxHQUFHLEVBQUMsV0FBVyxDQUFDLENBQUE7SUFDN0IsSUFBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFNBQVMsRUFBQztRQUMxQixPQUFPLFdBQVcsQ0FBQTtLQUNyQjtTQUFJO1FBQ0QsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUE7S0FDMUM7QUFDTCxDQUFDO0FBUEQsa0NBT0MiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgVmVjdG9yIGZyb20gXCIuL3ZlY3RvclwiXHJcbmltcG9ydCB7IGxlcnAsIGZpbGxSZWN0LCBpblJhbmdlLCBjbGFtcCB9IGZyb20gXCIuL3V0aWxzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBCbG9ja3tcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtaW46VmVjdG9yLCBwdWJsaWMgbWF4OlZlY3Rvcil7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBmcm9tU2l6ZShwb3M6VmVjdG9yLHNpemU6VmVjdG9yKXtcclxuICAgICAgICByZXR1cm4gbmV3IEJsb2NrKHBvcyxwb3MuYygpLmFkZChzaXplKSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb3JuZXIodjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcihcclxuICAgICAgICAgICAgbGVycCh0aGlzLm1pbi54LHRoaXMubWF4Lngsdi54KSxcclxuICAgICAgICAgICAgbGVycCh0aGlzLm1pbi55LHRoaXMubWF4Lnksdi55KSxcclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29ybmVyMENlbnRlcmVkKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVyKHYpXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMC41LDAuNSkpXHJcbiAgICB9XHJcblxyXG4gICAgc2V0KHY6VmVjdG9yLGNvcm5lcjpWZWN0b3Ipe1xyXG4gICAgICAgIHZhciBkaXNwbGFjZW1lbnQgPSB0aGlzLmdldENvcm5lcihjb3JuZXIpLnRvKHYpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW92ZShkaXNwbGFjZW1lbnQpXHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgbW92ZSh2OlZlY3Rvcil7XHJcbiAgICAgICAgdGhpcy5taW4uYWRkKHYpXHJcbiAgICAgICAgdGhpcy5tYXguYWRkKHYpXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBzaXplKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWluLnRvKHRoaXMubWF4KVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpe1xyXG4gICAgICAgIHZhciBzaXplID0gdGhpcy5zaXplKClcclxuICAgICAgICBmaWxsUmVjdChjdHh0LHRoaXMubWluLHNpemUpXHJcbiAgICB9XHJcblxyXG4gICAgYygpe1xyXG4gICAgICAgIHJldHVybiBuZXcgQmxvY2sodGhpcy5taW4uYygpLHRoaXMubWF4LmMoKSlcclxuICAgIH1cclxuXHJcbiAgICBjbGFtcCh2OlZlY3Rvcil7XHJcbiAgICAgICAgcmV0dXJuIHYubWFwKCh2YWwsYXJyLGkpID0+IGNsYW1wKHZhbCx0aGlzLm1pbi52YWxzW2ldLHRoaXMubWF4LnZhbHNbaV0pKVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyc2VjdFZlY3Rvcih2OlZlY3Rvcik6Ym9vbGVhbntcclxuICAgICAgICByZXR1cm4gaW5SYW5nZSh0aGlzLm1pbi54LHRoaXMubWF4Lngsdi54KSAmJiBpblJhbmdlKHRoaXMubWluLnksdGhpcy5tYXgueSx2LnkpXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBCbG9jayB9IGZyb20gXCIuL2Jsb2NrXCJcclxuaW1wb3J0IFZlY3RvciBmcm9tIFwiLi92ZWN0b3JcIlxyXG5pbXBvcnQgeyBFbnRpdHkgfSBmcm9tIFwiLi93b3JsZFwiXHJcbmltcG9ydCB7IEFuaW0sIEFuaW1UeXBlLCByb3VuZCwgVEFVLCBzdHJva2VSZWN0IH0gZnJvbSBcIi4vdXRpbHNcIlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2FtZXJhe1xyXG5cclxuICAgIFxyXG4gICAgXHJcbiAgICAvLyBvZmZzZXQ6VmVjdG9yXHJcbiAgICAvLyBjdXJyZW50VGFyZ2V0OlZlY3RvclxyXG4gICAgZGVhZFpvbmU6QmxvY2tcclxuICAgIHBvczpWZWN0b3JcclxuICAgIHRhcmdldDpWZWN0b3JcclxuXHJcbiAgICBzY3JlZW5zaGFrZUFuaW0gPSBuZXcgQW5pbSgpXHJcbiAgICB3b2JibGVzOm51bWJlciA9IDBcclxuICAgIHdvYmJsZWFtb3VudDpudW1iZXIgPSAwXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQscHVibGljIGZvY3VzOkVudGl0eSxwdWJsaWMgc2NyZWVuc2l6ZTpWZWN0b3Ipe1xyXG4gICAgICAgIHRoaXMucG9zID0gZm9jdXMuYmxvY2suY2VudGVyKClcclxuICAgICAgICAvLyB0aGlzLm9mZnNldCA9IHRoaXMuc2NyZWVuc2l6ZS5jKCkuc2NhbGUoMC41KS5zY2FsZSgtMSlcclxuICAgICAgICAvLyB2YXIgaGFsZnNpemUgPSB0aGlzLnNjcmVlbnNpemUuYygpLnNjYWxlKDAuNSlcclxuICAgICAgICB2YXIgc2xhY2tzaXplID0gbmV3IFZlY3RvcigxMDAsMTEwKVxyXG4gICAgICAgIC8vIHRoaXMuZGVhZFpvbmUgPSBuZXcgQmxvY2soaGFsZnNpemUuYygpLnN1YihzbGFja3NpemUpLCBoYWxmc2l6ZS5jKCkuYWRkKHNsYWNrc2l6ZSkpXHJcbiAgICAgICAgdGhpcy5kZWFkWm9uZSA9IG5ldyBCbG9jayhzbGFja3NpemUuYygpLnNjYWxlKC0xKSxzbGFja3NpemUpXHJcbiAgICAgICAgdGhpcy5zY3JlZW5zaGFrZUFuaW0uYW5pbVR5cGUgPSBBbmltVHlwZS5vbmNlXHJcbiAgICAgICAgdGhpcy5zY3JlZW5zaGFrZUFuaW0uYmVnaW4gPSAwXHJcbiAgICAgICAgdGhpcy5zY3JlZW5zaGFrZUFuaW0uZW5kID0gMVxyXG4gICAgfVxyXG5cclxuICAgIFxyXG5cclxuICAgIHVwZGF0ZSgpe1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLmZvY3VzLmJsb2NrLmNlbnRlcigpXHJcbiAgICAgICAgLy8gdGFyZ2V0LmFkZCh0aGlzLmZvY3VzLnZlbC5jKCkuc2lnbigpLnNjYWxlKDUwKSlcclxuICAgICAgICB0YXJnZXQuYWRkKHRoaXMuZm9jdXMudmVsLmMoKS5zY2FsZSgwLjIpKVxyXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XHJcbiAgICAgICAgdmFyIHBvczJ0YXJnZXQgPSB0aGlzLnBvcy50byh0YXJnZXQpXHJcbiAgICAgICAgdmFyIGNsYW1wZWRwMnQgPSB0aGlzLmRlYWRab25lLmNsYW1wKHBvczJ0YXJnZXQuYygpKVxyXG4gICAgICAgIHRoaXMucG9zLmFkZChjbGFtcGVkcDJ0LnRvKHBvczJ0YXJnZXQpKVxyXG5cclxuXHJcbiAgICAgICAgdmFyIHNjcmVlbnNoYWtlb2Zmc2V0ID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICAgICAgc2NyZWVuc2hha2VvZmZzZXQueSA9IE1hdGguc2luKHRoaXMuc2NyZWVuc2hha2VBbmltLmdldCgpICogdGhpcy53b2JibGVzKSAqIHRoaXMud29iYmxlYW1vdW50XHJcbiAgICAgICAgdGhpcy5zZXRDYW1lcmEodGhpcy5wb3MuYygpLmFkZChzY3JlZW5zaGFrZW9mZnNldCkpXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNjcmVlbnNoYWtlKGR1cmF0aW9uOm51bWJlcix3b2JibGVzOm51bWJlcix3b2JibGVhbW91bnQ6bnVtYmVyKXtcclxuICAgICAgICB0aGlzLndvYmJsZXMgPSB3b2JibGVzXHJcbiAgICAgICAgdGhpcy53b2JibGVhbW91bnQgPSB3b2JibGVhbW91bnRcclxuICAgICAgICB0aGlzLnNjcmVlbnNoYWtlQW5pbS5zdG9wd2F0Y2guc3RhcnQoKVxyXG4gICAgICAgIHRoaXMuc2NyZWVuc2hha2VBbmltLmR1cmF0aW9uID0gZHVyYXRpb25cclxuICAgICAgICB0aGlzLnNjcmVlbnNoYWtlQW5pbS5iZWdpbiA9IDBcclxuICAgICAgICB0aGlzLnNjcmVlbnNoYWtlQW5pbS5lbmQgPSBUQVVcclxuICAgIH1cclxuXHJcbiAgICBzZXRDYW1lcmEocG9zOlZlY3Rvcil7XHJcbiAgICAgICAgdGhpcy5jdHh0LnJlc2V0VHJhbnNmb3JtKClcclxuICAgICAgICBwb3Muc3ViKHRoaXMuc2NyZWVuc2l6ZS5jKCkuc2NhbGUoMC41KSlcclxuICAgICAgICB0aGlzLmN0eHQudHJhbnNsYXRlKHJvdW5kKC1wb3MueCkscm91bmQoLXBvcy55KSlcclxuICAgIH1cclxuXHJcbiAgICBkZWJ1Z2RyYXcoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpe1xyXG4gICAgICAgIGN0eHQuc3Ryb2tlU3R5bGUgPSAnYmxhY2snXHJcbiAgICAgICAgc3Ryb2tlUmVjdChjdHh0LHRoaXMucG9zLmMoKS5hZGQodGhpcy5kZWFkWm9uZS5taW4pLHRoaXMuZGVhZFpvbmUuc2l6ZSgpKVxyXG4gICAgICAgIGN0eHQuZmlsbFN0eWxlID0gJ3JlZCdcclxuICAgICAgICB0aGlzLnRhcmdldC5kcmF3KGN0eHQpXHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY2xhc3MgQm94PFQ+e1xyXG4gICAgYmVmb3JlQ2hhbmdlOkV2ZW50U3lzdGVtPFQ+ID0gbmV3IEV2ZW50U3lzdGVtKClcclxuICAgIGFmdGVyQ2hhbmdlOkV2ZW50U3lzdGVtPFQ+ID0gbmV3IEV2ZW50U3lzdGVtKClcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdmFsdWU6VCl7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldCgpOlR7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVcclxuICAgIH1cclxuXHJcbiAgICBzZXQodmFsOlQpe1xyXG4gICAgICAgIGlmKHZhbCAhPSB0aGlzLnZhbHVlKXtcclxuICAgICAgICAgICAgdGhpcy5iZWZvcmVDaGFuZ2UudHJpZ2dlcih0aGlzLnZhbHVlKVxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsXHJcbiAgICAgICAgICAgIHRoaXMuYWZ0ZXJDaGFuZ2UudHJpZ2dlcih0aGlzLnZhbHVlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBFdmVudDxUPntcclxuICAgIGNic2V0OlNldDxFdmVudExpc3RlbmVyPFQ+PiA9IG5ldyBTZXQoKVxyXG4gICAgaGFuZGxlZDpib29sZWFuID0gZmFsc2VcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdmFsdWU6VCl7XHJcblxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEV2ZW50TGlzdGVuZXI8VD4gPSAodmFsOlQsZTpQRXZlbnQ8VD4pID0+IHZvaWRcclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudFN5c3RlbTxUPntcclxuICAgIGxpc3RlbmVyczpFdmVudExpc3RlbmVyPFQ+W10gPSBbXVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGxpc3RlbihjYjpFdmVudExpc3RlbmVyPFQ+KXtcclxuICAgICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGNiKVxyXG4gICAgfVxyXG5cclxuICAgIHRyaWdnZXIodmFsOlQpe1xyXG4gICAgICAgIHRoaXMuY29udGludWUobmV3IFBFdmVudCh2YWwpKSBcclxuICAgIH1cclxuXHJcbiAgICBjb250aW51ZShlOlBFdmVudDxUPil7XHJcbiAgICAgICAgZm9yICh2YXIgY2Igb2YgdGhpcy5saXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgaWYoZS5jYnNldC5oYXMoY2IpID09IGZhbHNlKXtcclxuICAgICAgICAgICAgICAgIGUuY2JzZXQuYWRkKGNiKVxyXG4gICAgICAgICAgICAgICAgY2IoZS52YWx1ZSxlKVxyXG4gICAgICAgICAgICAgICAgaWYoZS5oYW5kbGVkKXtcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtsb29wLCBjcmVhdGVDYW52YXMsIGNsYW1wLCBrZXlzLCBmbG9vciwgcm91bmQsIGxpbmUsIHN0cm9rZVJlY3R9IGZyb20gJy4vdXRpbHMnXHJcbmltcG9ydCB7V29ybGQsIEVudGl0eX0gZnJvbSAnLi93b3JsZCdcclxuaW1wb3J0IHsgUGxhdGZvcm1Db250cm9sbGVyIH0gZnJvbSAnLi9wbGF0Zm9ybUNvbnRyb2xsZXInXHJcbmltcG9ydCBWZWN0b3IgZnJvbSAnLi92ZWN0b3InXHJcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSAnLi9ibG9jaydcclxuaW1wb3J0IHsgVG9wRG93bkNvbnRyb2xsZXIgfSBmcm9tICcuL3RvcGRvd25Db250cm9sbGVyJ1xyXG5pbXBvcnQgQ2FtZXJhIGZyb20gJy4vY2FtZXJhJ1xyXG5cclxudmFyIHggPSB3aW5kb3cgYXMgYW55XHJcbngua2V5cyA9IGtleXNcclxuXHJcbi8vIGtleXNbJ2QnXSA9IHRydWVcclxudmFyIGdyaWQgPSBbXHJcbiAgICBbMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFsxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwxLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMSwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwxLDEsMSwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDEsMF0sXHJcbiAgICBbMSwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFsxLDAsMCwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDBdLFxyXG4gICAgWzEsMCwxLDAsMCwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwxLDEsMV0sXHJcbl1cclxudmFyIGdyaWRzaXplID0gbmV3IFZlY3RvcihncmlkWzBdLmxlbmd0aCxncmlkLmxlbmd0aClcclxudmFyIHdvcmxkID0gbmV3IFdvcmxkKGdyaWRzaXplLDQwKVxyXG53b3JsZC5ncmlkID0gZ3JpZFxyXG52YXIgcGxhdGZvcm1Db250cm9sbGVyID0gbmV3IFBsYXRmb3JtQ29udHJvbGxlcihuZXcgRW50aXR5KEJsb2NrLmZyb21TaXplKG5ldyBWZWN0b3Iod29ybGQudGlsZXNpemUsd29ybGQudGlsZXNpemUpLm11bChuZXcgVmVjdG9yKDgsMTIpKSwgbmV3IFZlY3Rvcig0MCw0MCkpKSx3b3JsZClcclxuLy8gdmFyIHRvcGRvd25Db250cm9sbGVyID0gbmV3IFRvcERvd25Db250cm9sbGVyKG5ldyBFbnRpdHkoQmxvY2suZnJvbVNpemUobmV3IFZlY3Rvcih3b3JsZC50aWxlc2l6ZSx3b3JsZC50aWxlc2l6ZSkubXVsKG5ldyBWZWN0b3IoMTIsMTIpKSwgbmV3IFZlY3Rvcig0MCw0MCkpKSx3b3JsZClcclxudmFyIHNjcmVlbnNpemUgPSBncmlkc2l6ZS5jKCkuc2NhbGUod29ybGQudGlsZXNpemUpLy84MDAgNzIwXHJcbnZhciB7Y2FudmFzLGN0eHR9ID0gY3JlYXRlQ2FudmFzKHNjcmVlbnNpemUueCxzY3JlZW5zaXplLnkpXHJcbi8vIHBsYXRmb3JtQ29udHJvbGxlci5ib2R5LmJsb2NrLnNldChuZXcgVmVjdG9yKDQwLDQwKSxuZXcgVmVjdG9yKDAsMCkpXHJcbi8vIHBsYXRmb3JtQ29udHJvbGxlci5ib2R5LnNwZWVkID0gbmV3IFZlY3RvcigwLDEwMClcclxudmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoY3R4dCxwbGF0Zm9ybUNvbnRyb2xsZXIuYm9keSxzY3JlZW5zaXplKVxyXG54LnBsYXRmb3JtQ29udHJvbGxlciA9IHBsYXRmb3JtQ29udHJvbGxlclxyXG5sb29wKChkdCkgPT4ge1xyXG4gICAgaWYoa2V5c1sncCddKXtcclxuICAgICAgICAvLyBrZXlzWydwJ10gPSBmYWxzZVxyXG4gICAgICAgIC8vIGRlYnVnZ2VyXHJcbiAgICAgICAgY2FtZXJhLnNjcmVlbnNoYWtlKDEwMDAsOCwyMClcclxuICAgIH1cclxuICAgIFxyXG4gICAgY3R4dC5yZXNldFRyYW5zZm9ybSgpXHJcbiAgICBjdHh0LmNsZWFyUmVjdCgwLDAsc2NyZWVuc2l6ZS54LHNjcmVlbnNpemUueSlcclxuICAgIFxyXG4gICAgZHQgPSBjbGFtcChkdCwwLjAwNSwwLjEpXHJcbiAgICB3b3JsZC51cGRhdGUoZHQpLy9ib2R5IGdldHMgbW92ZWRcclxuICAgIGNhbWVyYS51cGRhdGUoKVxyXG4gICAgd29ybGQuZGVidWdEcmF3R3JpZChjdHh0KS8vYm9keSBnZXRzIGRyYXduXHJcbiAgICBjYW1lcmEuZGVidWdkcmF3KGN0eHQpXHJcbiAgICB3b3JsZC5kZWJ1Z0RyYXdSYXlzKGN0eHQpXHJcbiAgICB3b3JsZC5lbXB0eUZpcmVkUmF5cygpXHJcbn0pXHJcblxyXG5cclxuXHJcblxyXG4iLCJpbXBvcnQgeyAgV29ybGQsIEVudGl0eSwgYXBwbHlTdG9wcGluZ0ZvcmNlIH0gZnJvbSBcIi4vd29ybGRcIjtcclxuaW1wb3J0IFZlY3RvciBmcm9tIFwiLi92ZWN0b3JcIjtcclxuaW1wb3J0IHsgZ2V0MkRNb3ZlSW5wdXRZZmxpcHBlZCwga2V5cywgY2xhbXAsIHRvIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybUNvbnRyb2xsZXJ7XHJcbiAgICBncmF2aXR5OlZlY3RvciA9IG5ldyBWZWN0b3IoMCw4MDApXHJcbiAgICBqdW1wc3BlZWQ6bnVtYmVyID0gNDAwXHJcbiAgICBcclxuICAgIGFjY2ZvcmNlID0gMzAwMFxyXG4gICAgcGFzc2l2ZVN0b3BGb3JjZSA9IDMwMDBcclxuICAgIGFpcmFjY2ZvcmNlID0gMTAwMFxyXG4gICAgYWlycGFzc2l2ZVN0b3BGb3JjZSA9IDM1MFxyXG4gICAgXHJcbiAgICBqdW1wTWF4QW1tbyA9IDFcclxuICAgIGp1bXBBbW1vID0gdGhpcy5qdW1wTWF4QW1tb1xyXG4gICAgY2xpbWJmb3JjZSA9IDIwMDBcclxuICAgIHdhbGxoYW5nUmVzZXRzSnVtcEFtbW8gPSB0cnVlXHJcbiAgICBjb3lvdGV0aW1lID0gMC4zXHJcbiAgICBjb3lvdGV0aW1lciA9IHRoaXMuY295b3RldGltZVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBib2R5OkVudGl0eSxwdWJsaWMgIHdvcmxkOldvcmxkKXtcclxuICAgICAgICB3b3JsZC5lbnRpdGllcy5wdXNoKGJvZHkpXHJcblxyXG4gICAgICAgIHdvcmxkLmJlZm9yZVVwZGF0ZS5saXN0ZW4oKGR0KSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IGdldDJETW92ZUlucHV0WWZsaXBwZWQoKVxyXG5cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuYm9keS52ZWwuYWRkKHRoaXMuZ3Jhdml0eS5jKCkuc2NhbGUoZHQpKVxyXG4gICAgICAgICAgICBpZihrZXlzWyd3J10gJiYgdGhpcy5ib2R5Lmdyb3VuZGVkLnkgPT0gMSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmp1bXAoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vbW92ZVxyXG4gICAgICAgICAgICBpZihpbnB1dC54ICE9IDApe1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjY0ZvcmNlID0gdGhpcy5ib2R5Lmdyb3VuZGVkLnkgPT0gMCA/IHRoaXMuYWlyYWNjZm9yY2UgOiB0aGlzLmFjY2ZvcmNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJvZHkudmVsLnggKz0gaW5wdXQueCAqIGFjY0ZvcmNlICogZHRcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaGFuZ2luZyA9IHRoaXMuaXNIYW5naW5nKClcclxuICAgICAgICAgICAgICAgIGlmKGhhbmdpbmcgIT0gMCAmJiB0aGlzLmJvZHkudmVsLnkgPiAwKXtcclxuICAgICAgICAgICAgICAgICAgICBhcHBseVN0b3BwaW5nRm9yY2UodGhpcy5ib2R5LnZlbCxuZXcgVmVjdG9yKDAsdGhpcy5jbGltYmZvcmNlICogZHQpKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vcGFzc2l2ZSBzdG9wXHJcbiAgICAgICAgICAgIGlmKGlucHV0LnggPT0gMCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RvcHN0cmVuZ3RoID0gdGhpcy5ib2R5Lmdyb3VuZGVkLnkgPT0gMCA/IHRoaXMuYWlycGFzc2l2ZVN0b3BGb3JjZSA6IHRoaXMucGFzc2l2ZVN0b3BGb3JjZVxyXG4gICAgICAgICAgICAgICAgYXBwbHlTdG9wcGluZ0ZvcmNlKHRoaXMuYm9keS52ZWwsbmV3IFZlY3RvcihzdG9wc3RyZW5ndGggKiBkdCwwKSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGUucmVwZWF0IHx8IHRoaXMuYm9keS5ncm91bmRlZC55ID09IDEpey8vZ3JvdW5kIGp1bXBzIGFyZSBkb25lIGJ5IHBvbGxpbmcgaW4gdXBkYXRlXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihlLmtleSA9PSAnICcgfHwgZS5rZXkgPT0gJ3cnKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuanVtcCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB3b3JsZC5hZnRlclVwZGF0ZS5saXN0ZW4oKGR0KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuYm9keS5ncm91bmRlZC55ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qdW1wQW1tbyA9IHRoaXMuanVtcE1heEFtbW9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLmJvZHkuZ3JvdW5kZWQueCAhPSAwICYmIHRoaXMud2FsbGhhbmdSZXNldHNKdW1wQW1tbyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmp1bXBBbW1vID0gdGhpcy5qdW1wTWF4QW1tb1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNveW90ZXRpbWVyIC09IGR0XHJcbiAgICAgICAgICAgIGlmKHRoaXMuYm9keS5ncm91bmRlZC55ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb3lvdGV0aW1lciA9IHRoaXMuY295b3RldGltZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBcclxuXHJcbiAgICBcclxuICAgIGp1bXAoKXtcclxuICAgICAgICB2YXIgaGFuZ2luZyA9IHRoaXMuaXNIYW5naW5nKClcclxuICAgICAgICBcclxuICAgICAgICB2YXIganVtcCA9ICgpID0+IHtcclxuICAgICAgICAgICAgaWYoaGFuZ2luZyAhPSAwICYmIHRoaXMuYm9keS5ncm91bmRlZC55ID09IDApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ib2R5LnZlbCA9IG5ldyBWZWN0b3IoLWhhbmdpbmcsLTEpLm5vcm1hbGl6ZSgpLnNjYWxlKHRoaXMuanVtcHNwZWVkKVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHRoaXMuYm9keS52ZWwueSA9IC10aGlzLmp1bXBzcGVlZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICBpZihoYW5naW5nICE9IDAgfHwgdGhpcy5ib2R5Lmdyb3VuZGVkLnkgPT0gMSB8fCB0aGlzLmNveW90ZXRpbWVyID4gMCl7XHJcbiAgICAgICAgICAgIGp1bXAoKVxyXG4gICAgICAgICAgICB0aGlzLmNveW90ZXRpbWVyID0gMFxyXG4gICAgICAgIH1lbHNlIGlmKHRoaXMuanVtcEFtbW8gPiAwKXtcclxuICAgICAgICAgICAganVtcCgpXHJcbiAgICAgICAgICAgIHRoaXMuanVtcEFtbW8tLVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgaXNIYW5naW5nKCk6bnVtYmVye1xyXG4gICAgICAgIHZhciBoYW5naW5nID0gMFxyXG4gICAgICAgIGlmKHRoaXMud29ybGQuYm94Q2FzdCh0aGlzLmJvZHkuYmxvY2ssMCwwLjAxKS5oaXQpe1xyXG4gICAgICAgICAgICBoYW5naW5nID0gMVxyXG4gICAgICAgIH1lbHNlIGlmKHRoaXMud29ybGQuYm94Q2FzdCh0aGlzLmJvZHkuYmxvY2ssMCwtMC4wMSkuaGl0KXtcclxuICAgICAgICAgICAgaGFuZ2luZyA9IC0xXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoYW5naW5nXHJcbiAgICB9XHJcbiAgICBcclxufSIsImltcG9ydCBWZWN0b3IgZnJvbSBcIi4vdmVjdG9yXCI7XHJcblxyXG52YXIgbGFzdFVwZGF0ZSA9IERhdGUubm93KCk7XHJcbnZhciBUQVUgPSBNYXRoLlBJICogMlxyXG5leHBvcnQge1xyXG4gICAga2V5cyxcclxuICAgIFRBVSxcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvb3AoY2FsbGJhY2s6KGR0c2Vjb25kczpudW1iZXIpID0+IHZvaWQpe1xyXG4gICAgdmFyIG5vdyA9IERhdGUubm93KClcclxuICAgIGNhbGxiYWNrKChub3cgLSBsYXN0VXBkYXRlKSAvIDEwMDApXHJcbiAgICBsYXN0VXBkYXRlID0gbm93XHJcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICAgIGxvb3AoY2FsbGJhY2spXHJcbiAgICB9KVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmluZGJlc3RJbmRleDxUPihsaXN0OlRbXSwgZXZhbHVhdG9yOih2OlQpID0+IG51bWJlcik6bnVtYmVyIHtcclxuICAgIGlmIChsaXN0Lmxlbmd0aCA8IDEpIHtcclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICB9XHJcbiAgICB2YXIgYmVzdEluZGV4ID0gMDtcclxuICAgIHZhciBiZXN0c2NvcmUgPSBldmFsdWF0b3IobGlzdFswXSlcclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBzY29yZSA9IGV2YWx1YXRvcihsaXN0W2ldKVxyXG4gICAgICAgIGlmIChzY29yZSA+IGJlc3RzY29yZSkge1xyXG4gICAgICAgICAgICBiZXN0c2NvcmUgPSBzY29yZVxyXG4gICAgICAgICAgICBiZXN0SW5kZXggPSBpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJlc3RJbmRleFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmluZGJlc3Q8VD4obGlzdDpUW10sIGV2YWx1YXRvcjoodjpUKSA9PiBudW1iZXIpOlQge1xyXG4gICAgcmV0dXJuIGxpc3RbZmluZGJlc3RJbmRleChsaXN0LGV2YWx1YXRvcildXHJcbn1cclxudmFyIGtleXMgPSB7fVxyXG5cclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcclxuICAgIGtleXNbZS5rZXldID0gdHJ1ZVxyXG59KVxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBlID0+IHtcclxuICAgIGtleXNbZS5rZXldID0gZmFsc2UgIFxyXG59KVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldDJETW92ZUlucHV0WWZsaXBwZWQoKXtcclxuICAgIHZhciByZXMgPSBuZXcgVmVjdG9yKDAsMClcclxuICAgIGlmKGtleXNbJ3cnXSl7XHJcbiAgICAgICAgcmVzLnktLVxyXG4gICAgfVxyXG4gICAgaWYoa2V5c1sncyddKXtcclxuICAgICAgICByZXMueSsrXHJcbiAgICB9XHJcbiAgICBpZihrZXlzWydhJ10pe1xyXG4gICAgICAgIHJlcy54LS1cclxuICAgIH1cclxuICAgIGlmKGtleXNbJ2QnXSl7XHJcbiAgICAgICAgcmVzLngrK1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5SYW5nZShtaW4sbWF4LHYpe1xyXG4gICAgcmV0dXJuIHYgPj0gbWluICYmIHYgPD0gbWF4XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXAodmFsOm51bWJlcixmcm9tMTpudW1iZXIsZnJvbTI6bnVtYmVyLHRvMTpudW1iZXIsdG8yOm51bWJlcik6bnVtYmVye1xyXG4gICAgcmV0dXJuIGxlcnAodG8xLHRvMixpbnZlcnNlTGVycCh2YWwsZnJvbTEsZnJvbTIpKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW52ZXJzZUxlcnAodmFsOm51bWJlcixhOm51bWJlcixiOm51bWJlcik6bnVtYmVye1xyXG4gICAgcmV0dXJuIHRvKGEsdmFsKSAvIHRvKGEsYilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvKGE6bnVtYmVyLGI6bnVtYmVyKXtcclxuICAgIHJldHVybiBiIC0gYVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGVycChhOm51bWJlcixiOm51bWJlcix0Om51bWJlcil7XHJcbiAgICByZXR1cm4gYSArIHRvKGEsYikgKiB0XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzd2FwKGFycixhLGIpe1xyXG4gICAgdmFyIHRlbXAgPSBhcnJbYV1cclxuICAgIGFyclthXSA9IGFycltiXVxyXG4gICAgYXJyW2JdID0gdGVtcFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsbFJlY3QoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQscG9zOlZlY3RvcixzaXplOlZlY3Rvcil7XHJcbiAgICBjdHh0LmZpbGxSZWN0KHJvdW5kKHBvcy54KSwgcm91bmQocG9zLnkpLCBzaXplLngsIHNpemUueSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0cm9rZVJlY3QoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQscG9zOlZlY3RvcixzaXplOlZlY3Rvcil7XHJcbiAgICBjdHh0LnN0cm9rZVJlY3Qocm91bmQocG9zLngpICsgMC41LCByb3VuZChwb3MueSkgKyAwLjUsIHNpemUueCwgc2l6ZS55KVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGluZShjdHh0OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxvcmlnaW46VmVjdG9yLGRlc3RpbmF0aW9uOlZlY3Rvcil7XHJcbiAgICBjdHh0LmJlZ2luUGF0aCgpXHJcbiAgICB2YXIgZGlyID0gb3JpZ2luLnRvKGRlc3RpbmF0aW9uKS5ub3JtYWxpemUoKS5zY2FsZSgwLjUpXHJcbiAgICBjdHh0Lm1vdmVUbyhNYXRoLnJvdW5kKG9yaWdpbi54KSArIDAuNSAtIGRpci54LE1hdGgucm91bmQob3JpZ2luLnkpICsgMC41IC0gZGlyLnkpXHJcbiAgICBjdHh0LmxpbmVUbyhNYXRoLnJvdW5kKGRlc3RpbmF0aW9uLngpICsgMC41ICAtIGRpci54LE1hdGgucm91bmQoZGVzdGluYXRpb24ueSkgKyAwLjUgLSBkaXIueSlcclxuICAgIGN0eHQuc3Ryb2tlKClcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbjJEYXJyYXk8VD4oc2l6ZTpWZWN0b3IsY2I6KGk6VmVjdG9yKSA9PiBUKTpUW11bXXtcclxuICAgIHZhciByZXM6VFtdW10gPSBbXVxyXG4gICAgdmFyIGluZGV4ID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICBmb3IoaW5kZXgueSA9IDA7IGluZGV4LnkgPCBzaXplLnk7IGluZGV4LnkrKyl7XHJcbiAgICAgICAgdmFyIHJvdzpUW10gPSBbXVxyXG4gICAgICAgIHJlcy5wdXNoKHJvdylcclxuICAgICAgICBmb3IoaW5kZXgueCA9IDA7IGluZGV4LnggPCBzaXplLng7IGluZGV4LngrKyl7XHJcbiAgICAgICAgICAgIHJvdy5wdXNoKGNiKGluZGV4KSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDYW52YXMoeDogbnVtYmVyLCB5OiBudW1iZXIpe1xyXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICBjYW52YXMud2lkdGggPSB4O1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcylcclxuICAgIHZhciBjdHh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgIHJldHVybiB7Y3R4dDpjdHh0LGNhbnZhczpjYW52YXN9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2xhbXAodmFsLG1pbixtYXgpe1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KE1hdGgubWluKHZhbCxtYXgpLG1pbilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxlbmd0aGVuKHZhbCxhbW91bnQpe1xyXG4gICAgcmV0dXJuIHZhbCArIGFtb3VudCAqIE1hdGguc2lnbih2YWwpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmbG9vcih2YWwpe1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IodmFsKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2VpbCh2YWwpe1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbCh2YWwpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByb3VuZCh2YWwpe1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQodmFsKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tKCl7XHJcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWluKGEsYil7XHJcbiAgICByZXR1cm4gTWF0aC5taW4oYSxiKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF4KGEsYil7XHJcbiAgICByZXR1cm4gTWF0aC5tYXgoYSxiKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW9kKG51bWJlcjogbnVtYmVyLCBtb2R1bHVzOiBudW1iZXIpe1xyXG4gICAgcmV0dXJuICgobnVtYmVyJW1vZHVsdXMpK21vZHVsdXMpJW1vZHVsdXM7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdG9wV2F0Y2h7XHJcblxyXG4gICAgc3RhcnR0aW1lc3RhbXAgPSBEYXRlLm5vdygpXHJcbiAgICBwYXVzZXRpbWVzdGFtcCA9IERhdGUubm93KClcclxuICAgIHBhdXNldGltZSA9IDBcclxuICAgIHBhdXNlZCA9IHRydWVcclxuXHJcbiAgICBnZXQoKTpudW1iZXJ7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRhbW91bnRwYXVzZWQgPSAwXHJcbiAgICAgICAgaWYodGhpcy5wYXVzZWQpe1xyXG4gICAgICAgICAgICBjdXJyZW50YW1vdW50cGF1c2VkID0gdG8odGhpcy5wYXVzZXRpbWVzdGFtcCxEYXRlLm5vdygpKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG8odGhpcy5zdGFydHRpbWVzdGFtcCwgRGF0ZS5ub3coKSkgLSAodGhpcy5wYXVzZXRpbWUgKyBjdXJyZW50YW1vdW50cGF1c2VkKVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgc3RhcnQoKXtcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5zdGFydHRpbWVzdGFtcCA9IERhdGUubm93KClcclxuICAgICAgICB0aGlzLnBhdXNldGltZSA9IDBcclxuICAgIH1cclxuXHJcbiAgICBjb250aW51ZSgpe1xyXG4gICAgICAgIGlmKHRoaXMucGF1c2VkKXtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLnBhdXNldGltZSArPSB0byh0aGlzLnBhdXNldGltZXN0YW1wLCBEYXRlLm5vdygpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpe1xyXG4gICAgICAgIGlmKHRoaXMucGF1c2VkID09IGZhbHNlKXtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIHRoaXMucGF1c2V0aW1lc3RhbXAgPSBEYXRlLm5vdygpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlc2V0KCl7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5zdGFydHRpbWVzdGFtcCA9IERhdGUubm93KClcclxuICAgICAgICB0aGlzLnBhdXNldGltZXN0YW1wID0gRGF0ZS5ub3coKVxyXG4gICAgICAgIHRoaXMucGF1c2V0aW1lID0gMFxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZW51bSBBbmltVHlwZXtvbmNlLHJlcGVhdCxwaW5ncG9uZyxleHRlbmR9XHJcblxyXG5leHBvcnQgY2xhc3MgQW5pbXtcclxuICAgIGFuaW1UeXBlOkFuaW1UeXBlID0gQW5pbVR5cGUub25jZVxyXG4gICAgcmV2ZXJzZTpib29sZWFuID0gZmFsc2VcclxuICAgIGR1cmF0aW9uOm51bWJlciA9IDEwMDBcclxuICAgIHN0b3B3YXRjaDpTdG9wV2F0Y2ggPSBuZXcgU3RvcFdhdGNoKClcclxuICAgIGJlZ2luOm51bWJlciA9IDBcclxuICAgIGVuZDpudW1iZXIgPSAxXHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KCk6bnVtYmVye1xyXG4gICAgICAgIHZhciBjeWNsZXMgPSB0aGlzLnN0b3B3YXRjaC5nZXQoKSAvIHRoaXMuZHVyYXRpb25cclxuXHJcbiAgICAgICAgc3dpdGNoICh0aGlzLmFuaW1UeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgQW5pbVR5cGUub25jZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBjbGFtcChsZXJwKHRoaXMuYmVnaW4sdGhpcy5lbmQsY3ljbGVzKSx0aGlzLmJlZ2luLHRoaXMuZW5kKSBcclxuICAgICAgICAgICAgY2FzZSBBbmltVHlwZS5yZXBlYXQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVycCh0aGlzLmJlZ2luLHRoaXMuZW5kLG1vZChjeWNsZXMsMSkpXHJcbiAgICAgICAgICAgIGNhc2UgQW5pbVR5cGUucGluZ3Bvbmc6XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBwaW5ncG9uZ2N5Y2xlID0gbW9kKGN5Y2xlcywgMilcclxuICAgICAgICAgICAgICAgIGlmKHBpbmdwb25nY3ljbGUgPD0gMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlcnAodGhpcy5iZWdpbix0aGlzLmVuZCxwaW5ncG9uZ2N5Y2xlKVxyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlcnAodGhpcy5lbmQsdGhpcy5iZWdpbixwaW5ncG9uZ2N5Y2xlIC0gMSlcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNhc2UgQW5pbVR5cGUuZXh0ZW5kOlxyXG4gICAgICAgICAgICAgICAgdmFyIGRpc3RQZXJDeWNsZSA9IHRvKHRoaXMuYmVnaW4sdGhpcy5lbmQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihjeWNsZXMpICogZGlzdFBlckN5Y2xlICsgbGVycCh0aGlzLmJlZ2luLHRoaXMuZW5kLG1vZChjeWNsZXMsMSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IHJvdW5kIH0gZnJvbSBcIi4vdXRpbHNcIlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmVjdG9ye1xyXG4gICAgdmFsczpudW1iZXJbXSA9IFtdXHJcbiAgICBjb25zdHJ1Y3Rvcih4LCB5LCB6ID0gMCl7XHJcbiAgICAgICAgdGhpcy52YWxzWzBdID0geFxyXG4gICAgICAgIHRoaXMudmFsc1sxXSA9IHlcclxuICAgICAgICB0aGlzLnZhbHNbMl0gPSB6XHJcbiAgICB9XHJcblxyXG4gICAgYWRkKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IHZhbCArIHYudmFsc1tpXSlcclxuICAgIH1cclxuXHJcbiAgICBzdWIodjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gdmFsIC0gdi52YWxzW2ldKVxyXG4gICAgfVxyXG5cclxuICAgIG11bCh2OlZlY3Rvcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiB2YWwgKiB2LnZhbHNbaV0pXHJcbiAgICB9XHJcblxyXG4gICAgZGl2KHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IHZhbCAvIHYudmFsc1tpXSlcclxuICAgIH1cclxuXHJcbiAgICBzY2FsZSh2Om51bWJlcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiB2YWwgKiB2KVxyXG4gICAgfVxyXG5cclxuICAgIHRvKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHYuYygpLnN1Yih0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIGZsb29yKCk6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiBNYXRoLmZsb29yKHZhbCkpXHJcbiAgICB9XHJcblxyXG4gICAgY2VpbCgpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gTWF0aC5jZWlsKHZhbCkpXHJcbiAgICB9XHJcblxyXG4gICAgc2lnbigpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gTWF0aC5zaWduKHZhbCkpXHJcbiAgICB9XHJcblxyXG4gICAgbGVycCh2OlZlY3Rvcix0Om51bWJlcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLmMoKS5hZGQodGhpcy50byh2KS5zY2FsZSh0KSlcclxuICAgIH1cclxuXHJcbiAgICBsZW5ndGhzcSgpOm51bWJlcntcclxuICAgICAgICB2YXIgc3VtID0gMDtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy52YWxzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgc3VtICs9IHRoaXMudmFsc1tpXSAqIHRoaXMudmFsc1tpXVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3VtXHJcbiAgICB9XHJcblxyXG4gICAgbGVuZ3RoKCk6bnVtYmVye1xyXG4gICAgICAgIHJldHVybiBNYXRoLnBvdyh0aGlzLmxlbmd0aHNxKCksMC41KVxyXG4gICAgfVxyXG5cclxuICAgIG5vcm1hbGl6ZSgpOlZlY3RvcntcclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKVxyXG4gICAgICAgIGlmKGxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGUoMClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGUoMSAvIGxlbmd0aClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYygpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcigwLDApLm92ZXJ3cml0ZSh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIG92ZXJ3cml0ZSh2OlZlY3Rvcil7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IHYudmFsc1tpXSlcclxuICAgIH1cclxuXHJcbiAgICBkb3QodjpWZWN0b3IpOm51bWJlcntcclxuICAgICAgICB2YXIgc3VtID0gMFxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLnZhbHMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBzdW0gKz0gdGhpcy52YWxzW2ldICogdi52YWxzW2ldXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdW1cclxuICAgIH1cclxuXHJcbiAgICBnZXQoaTpudW1iZXIpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHNbaV1cclxuICAgIH1cclxuXHJcbiAgICBzZXQoaTpudW1iZXIsdmFsOm51bWJlcil7XHJcbiAgICAgICAgdGhpcy52YWxzW2ldID0gdmFsXHJcbiAgICB9XHJcblxyXG4gICAgY3Jvc3ModjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICB2YXIgeCA9IHRoaXMueSAqIHYueiAtIHRoaXMueiAqIHYueVxyXG4gICAgICAgIHZhciB5ID0gdGhpcy56ICogdi54IC0gdGhpcy54ICogdi56XHJcbiAgICAgICAgdmFyIHogPSB0aGlzLnggKiB2LnkgLSB0aGlzLnkgKiB2LnhcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3Rvcih4LHkseilcclxuICAgIH1cclxuXHJcbiAgICBwcm9qZWN0T250byh2OlZlY3Rvcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB2LmMoKS5zY2FsZSh0aGlzLmRvdCh2KSAvIHYuZG90KHYpKSAgXHJcbiAgICB9XHJcblxyXG4gICAgbG9vcDJkKGNiOihpOlZlY3RvcikgPT4gdm9pZCl7XHJcbiAgICAgICAgdmFyIGNvdW50ZXIgPSBuZXcgVmVjdG9yKDAsMClcclxuICAgICAgICBmb3IoY291bnRlci54ID0gMDsgY291bnRlci54IDwgdGhpcy54OyBjb3VudGVyLngrKyl7XHJcbiAgICAgICAgICAgIGZvcihjb3VudGVyLnkgPSAwOyBjb3VudGVyLnkgPCB0aGlzLnk7IGNvdW50ZXIueSsrKXtcclxuICAgICAgICAgICAgICAgIGNiKGNvdW50ZXIpXHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcm90YXRlMmQocm90YXRpb25zOm51bWJlcixvcmlnaW46VmVjdG9yID0gbmV3IFZlY3RvcigwLDApKTpWZWN0b3J7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjdHh0OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCk6VmVjdG9ye1xyXG4gICAgICAgIHZhciB3aWR0aCA9IDEwXHJcbiAgICAgICAgdmFyIGh3ID0gd2lkdGggLyAyXHJcbiAgICAgICAgY3R4dC5maWxsUmVjdChyb3VuZCh0aGlzLnggLSBodykscm91bmQodGhpcy55IC0gaHcpLHdpZHRoLHdpZHRoIClcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIG1hcChjYjoodmFsLGFycmF5LGkpID0+IG51bWJlcik6VmVjdG9ye1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLnZhbHMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICAgdGhpcy52YWxzW2ldID0gY2IodGhpcy52YWxzW2ldLHRoaXMudmFscyxpKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB4KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsc1swXVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB5KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsc1sxXVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsc1syXVxyXG4gICAgfVxyXG5cclxuICAgIHNldCB4KHZhbCl7XHJcbiAgICAgICAgdGhpcy52YWxzWzBdID0gdmFsXHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHkodmFsKXtcclxuICAgICAgICB0aGlzLnZhbHNbMV0gPSB2YWxcclxuICAgIH1cclxuXHJcbiAgICBzZXQgeih2YWwpe1xyXG4gICAgICAgIHRoaXMudmFsc1syXSA9IHZhbFxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIHplcm8gPSBuZXcgVmVjdG9yKDAsMCk7IiwiaW1wb3J0IFZlY3RvciBmcm9tICcuL3ZlY3RvcidcclxuaW1wb3J0IHsgaW52ZXJzZUxlcnAsIGZpbmRiZXN0LCBpblJhbmdlLCB0bywgc3dhcCwgZmluZGJlc3RJbmRleCwgbGluZSwgZ2VuMkRhcnJheSwgbGVycCwgbGVuZ3RoZW4sIGNsYW1wLCBjZWlsIH0gZnJvbSAnLi91dGlscydcclxuaW1wb3J0IHsgRXZlbnRTeXN0ZW0sIEJveCB9IGZyb20gJy4vZXZlbnRzeXN0ZW0nXHJcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSAnLi9ibG9jaydcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRW50aXR5e1xyXG4gICAgZ3JvdW5kZWQ6VmVjdG9yID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICB2ZWw6VmVjdG9yID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICBtaW5zcGVlZDpWZWN0b3IgPSBuZXcgVmVjdG9yKC0zMDAsLTYwMClcclxuICAgIG1heHNwZWVkOlZlY3RvciA9IG5ldyBWZWN0b3IoMzAwLDYwMClcclxuICAgIGRpcjpWZWN0b3IgPSBuZXcgVmVjdG9yKDEsMClcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgYmxvY2s6QmxvY2spe1xyXG5cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJveGNhc3RIaXR7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgcHVibGljIHJheXM6UmF5Y2FzdEhpdFtdLFxyXG4gICAgICAgIHB1YmxpYyBoaXQ6Ym9vbGVhbixcclxuICAgICAgICBwdWJsaWMgaGl0cmF5OlJheWNhc3RIaXQsXHJcbiAgICApe1xyXG5cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFJheWNhc3RIaXR7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgcHVibGljIGhpdDpib29sZWFuLFxyXG4gICAgICAgIHB1YmxpYyBvcmlnaW46VmVjdG9yLFxyXG4gICAgICAgIHB1YmxpYyBkaXI6VmVjdG9yLFxyXG4gICAgICAgIHB1YmxpYyBoaXRMb2NhdGlvbjpWZWN0b3IsXHJcbiAgICAgICAgcHVibGljIHJlbEhpdExvY2F0aW9uOlZlY3RvcixcclxuICAgICAgICBwdWJsaWMgbm9ybWFsOlZlY3RvcixcclxuICAgICAgICBwdWJsaWMgaGl0SW5kZXg6VmVjdG9yLFxyXG4gICAgKXtcclxuXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmxke1xyXG5cclxuICAgIFxyXG4gICAgZ3JpZDpudW1iZXJbXVtdID0gW11cclxuICAgIGVudGl0aWVzOkVudGl0eVtdID0gW11cclxuICAgIGZpcmVkUmF5czpSYXljYXN0SGl0W10gPSBbXVxyXG4gICAgYmVmb3JlVXBkYXRlID0gbmV3IEV2ZW50U3lzdGVtPG51bWJlcj4oKVxyXG4gICAgYWZ0ZXJVcGRhdGUgPSBuZXcgRXZlbnRTeXN0ZW08bnVtYmVyPigpXHJcbiAgICBza2lud2lkdGggPSAwLjAxXHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIGdyaWRzaXplOlZlY3RvciwgcHVibGljIHRpbGVzaXplOm51bWJlcil7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ2VuMkRhcnJheShncmlkc2l6ZSwoKSA9PiAwKVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShkdHNlY29uZHM6bnVtYmVyKXtcclxuICAgICAgICB0aGlzLmJlZm9yZVVwZGF0ZS50cmlnZ2VyKGR0c2Vjb25kcylcclxuICAgICAgICBmb3IodmFyIGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKXtcclxuICAgICAgICAgICAgdmFyIHNwZWVkID0gZW50aXR5LnZlbC5jKCkuc2NhbGUoZHRzZWNvbmRzKVxyXG4gICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vY2xhbXAgc3BlZWRcclxuICAgICAgICAgICAgZW50aXR5LnZlbC5tYXAoKHZhbCxhcnIsIGkpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjbGFtcCh2YWwsZW50aXR5Lm1pbnNwZWVkLmdldChpKSxlbnRpdHkubWF4c3BlZWQuZ2V0KGkpKVxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgdGhpcy5tb3ZlKGVudGl0eSxzcGVlZClcclxuICAgICAgICAgICAgaWYoc3BlZWQubGVuZ3Roc3EoKSA+IDApe1xyXG4gICAgICAgICAgICAgICAgZW50aXR5LmRpciA9IHNwZWVkLmMoKS5ub3JtYWxpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWZ0ZXJVcGRhdGUudHJpZ2dlcihkdHNlY29uZHMpXHJcbiAgICB9XHJcblxyXG4gICAgbW92ZShlbnRpdHk6RW50aXR5LGFtb3VudDpWZWN0b3Ipe1xyXG4gICAgICAgIHRoaXMubW92ZUF4aXMoZW50aXR5LDAsYW1vdW50LngpXHJcbiAgICAgICAgdGhpcy5tb3ZlQXhpcyhlbnRpdHksMSxhbW91bnQueSlcclxuICAgIH1cclxuXHJcbiAgICBtb3ZlQXhpcyhlbnRpdHk6RW50aXR5LGF4aXM6bnVtYmVyLGFtb3VudDpudW1iZXIpe1xyXG4gICAgICAgIGlmKGFtb3VudCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBoaXQgPSB0aGlzLmJveENhc3QoZW50aXR5LmJsb2NrLGF4aXMsYW1vdW50KVxyXG4gICAgICAgIGVudGl0eS5ibG9jay5tb3ZlKGhpdC5oaXRyYXkucmVsSGl0TG9jYXRpb24pXHJcbiAgICAgICAgZW50aXR5Lmdyb3VuZGVkLnZhbHNbYXhpc10gPSAoaGl0LmhpdCA/IDEgOiAwKSAqIE1hdGguc2lnbihhbW91bnQpXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoaGl0LmhpdCl7XHJcbiAgICAgICAgICAgIGVudGl0eS52ZWwudmFsc1theGlzXSA9IDBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYm94Q2FzdChibG9jazpCbG9jayxheGlzOm51bWJlcixhbW91bnQ6bnVtYmVyLF9za2lud2lkdGggPSB0aGlzLnNraW53aWR0aCl7XHJcbiAgICAgICAgdmFyIGRpciA9IFZGcm9tQXhpc0Ftb3VudChheGlzLGFtb3VudClcclxuICAgICAgICBpZihhbW91bnQgPT0gMCl7XHJcbiAgICAgICAgICAgIHZhciBkdXQgPSBuZXcgUmF5Y2FzdEhpdChmYWxzZSxibG9jay5jZW50ZXIoKSxkaXIsbnVsbCxuZXcgVmVjdG9yKDAsMCksbnVsbCxudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJveGNhc3RIaXQoW2R1dF0sZmFsc2UsZHV0KSBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHNraW5ibG9jayA9IGJsb2NrLmMoKVxyXG4gICAgICAgIHNraW5ibG9jay5taW4uYWRkKG5ldyBWZWN0b3IoX3NraW53aWR0aCxfc2tpbndpZHRoKSlcclxuICAgICAgICBza2luYmxvY2subWF4LnN1YihuZXcgVmVjdG9yKF9za2lud2lkdGgsX3NraW53aWR0aCkpXHJcblxyXG4gICAgICAgIHZhciBwb2ludHMgPSB0aGlzLmdldFBvaW50c09uRWRnZShza2luYmxvY2ssZGlyKVxyXG4gICAgICAgIHZhciByYXlzID0gcG9pbnRzLm1hcChwb2ludCA9PiB0aGlzLnJheWNhc3RBeGlzQWxpZ25lZChwb2ludCxheGlzLGxlbmd0aGVuKGFtb3VudCxfc2tpbndpZHRoKSkpXHJcbiAgICAgICAgdmFyIGhpdHJheSA9IGZpbmRiZXN0KHJheXMuZmlsdGVyKHJheSA9PiByYXkuaGl0KSxyYXkgPT4gLXJheS5yZWxIaXRMb2NhdGlvbi5sZW5ndGgoKSlcclxuICAgICAgICBmb3IodmFyIHJheSBvZiByYXlzKXtcclxuICAgICAgICAgICAgcmF5LnJlbEhpdExvY2F0aW9uLnZhbHNbYXhpc10gPSBsZW5ndGhlbihyYXkucmVsSGl0TG9jYXRpb24udmFsc1theGlzXSwgLV9za2lud2lkdGgpXHJcbiAgICAgICAgICAgIHRoaXMuZmlyZWRSYXlzLnB1c2gocmF5KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IEJveGNhc3RIaXQocmF5cyxoaXRyYXk/LmhpdCA/PyBmYWxzZSxoaXRyYXkgPz8gcmF5c1swXSlcclxuICAgIH1cclxuXHJcbiAgICByYXljYXN0QXhpc0FsaWduZWQob3JpZ2luV29ybGQ6VmVjdG9yLGF4aXMsYW1vdW50KTpSYXljYXN0SGl0e1xyXG4gICAgICAgIHZhciBkaXJXb3JsZCA9IFZGcm9tQXhpc0Ftb3VudChheGlzLGFtb3VudClcclxuICAgICAgICB2YXIgZW5kID0gb3JpZ2luV29ybGQuYygpLmFkZChkaXJXb3JsZClcclxuICAgICAgICB2YXIgYm94ZXMyY2hlY2sgPSBjZWlsKE1hdGguYWJzKGFtb3VudCkgLyB0aGlzLnRpbGVzaXplKVxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPD0gYm94ZXMyY2hlY2s7IGkrKyl7XHJcbiAgICAgICAgICAgIHZhciBwb3MgPSBvcmlnaW5Xb3JsZC5sZXJwKGVuZCxpIC8gYm94ZXMyY2hlY2spXHJcbiAgICAgICAgICAgIGlmKHRoaXMuaXNCbG9ja2VkKHBvcykpe1xyXG4gICAgICAgICAgICAgICAgdmFyIHJheWNhc3QgPSB0aGlzLnJheUNhc3Qob3JpZ2luV29ybGQsZGlyV29ybGQsdGhpcy5nZXRCbG9jayhwb3MpKVxyXG4gICAgICAgICAgICAgICAgcmF5Y2FzdC5oaXRJbmRleCA9IHRoaXMud29ybGQyaW5kZXgocG9zKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJheWNhc3RcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFJheWNhc3RIaXQoZmFsc2Usb3JpZ2luV29ybGQsZGlyV29ybGQsb3JpZ2luV29ybGQuYygpLmFkZChkaXJXb3JsZCksZGlyV29ybGQuYygpLGRpcldvcmxkLmMoKS5ub3JtYWxpemUoKS5zY2FsZSgtMSksbnVsbClcclxuICAgIH1cclxuXHJcbiAgICByYXlDYXN0KG9yaWdpbjpWZWN0b3IsZGlyOlZlY3RvcixibG9jazpCbG9jayl7XHJcbiAgICAgICAgdmFyIGVuZCA9IG9yaWdpbi5jKCkuYWRkKGRpcilcclxuICAgICAgICB2YXIgcmVzOlJheWNhc3RIaXQgPSBuZXcgUmF5Y2FzdEhpdChmYWxzZSxvcmlnaW4sZGlyLG51bGwsbnVsbCxudWxsLG51bGwpXHJcblxyXG4gICAgICAgIHZhciBvdXQ6W251bWJlcixudW1iZXJdID0gWzAsMF1cclxuICAgICAgICBcclxuICAgICAgICByZXMuaGl0ID0gY29sbGlkZUxpbmUob3JpZ2luLG9yaWdpbi5jKCkuYWRkKGRpciksYmxvY2ssb3V0KVxyXG4gICAgICAgIHJlcy5oaXRMb2NhdGlvbiA9IG9yaWdpbi5sZXJwKGVuZCxvdXRbMF0pXHJcbiAgICAgICAgcmVzLnJlbEhpdExvY2F0aW9uID0gb3JpZ2luLnRvKHJlcy5oaXRMb2NhdGlvbilcclxuICAgICAgICByZXR1cm4gcmVzXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UG9pbnRzT25FZGdlKGJveDpCbG9jayxkaXI6VmVjdG9yKXtcclxuXHJcbiAgICAgICAgdmFyIHJlczpWZWN0b3JbXSA9IFtdXHJcbiAgICAgICAgdmFyIGNvcm5lcnMgPSBbXHJcbiAgICAgICAgICAgIGJveC5nZXRDb3JuZXIobmV3IFZlY3RvcigwLDApKSxcclxuICAgICAgICAgICAgYm94LmdldENvcm5lcihuZXcgVmVjdG9yKDEsMCkpLFxyXG4gICAgICAgICAgICBib3guZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMSwxKSksXHJcbiAgICAgICAgICAgIGJveC5nZXRDb3JuZXIobmV3IFZlY3RvcigwLDEpKSxcclxuICAgICAgICBdXHJcbiAgICAgICAgY29ybmVycyA9IGNvcm5lcnMuZmlsdGVyKGNvcm5lciA9PiBib3guY2VudGVyKCkudG8oY29ybmVyKS5ub3JtYWxpemUoKS5kb3QoZGlyLmMoKS5ub3JtYWxpemUoKSkgPiAwKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdGFydCA9IGNvcm5lcnNbMF1cclxuICAgICAgICB2YXIgZW5kID0gY29ybmVyc1sxXVxyXG4gICAgICAgIHZhciBub2Zwb2ludHMgPSBjZWlsKHN0YXJ0LnRvKGVuZCkubGVuZ3RoKCkgLyB0aGlzLnRpbGVzaXplKSArIDFcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbm9mcG9pbnRzO2krKyl7XHJcbiAgICAgICAgICAgIHJlcy5wdXNoKHN0YXJ0LmxlcnAoZW5kLChpIC8gKG5vZnBvaW50cyAtIDEpKSkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGVtcHR5RmlyZWRSYXlzKCl7XHJcbiAgICAgICAgdGhpcy5maXJlZFJheXMgPSBbXVxyXG4gICAgfVxyXG5cclxuICAgIGlzQmxvY2tlZCh3b3JsZDpWZWN0b3Ipe1xyXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMud29ybGQyaW5kZXgod29ybGQpXHJcbiAgICAgICAgaWYoaW5SYW5nZSgwLHRoaXMuZ3JpZHNpemUueCAtIDEsaW5kZXgueCkgJiYgaW5SYW5nZSgwLHRoaXMuZ3JpZHNpemUueSAtIDEsaW5kZXgueSkpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ncmlkW2luZGV4LnldW2luZGV4LnhdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIGlzQmxvY2tlZEluZGV4KGluZGV4OlZlY3Rvcil7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZFtpbmRleC55XVtpbmRleC54XVxyXG4gICAgfVxyXG5cclxuICAgIGdldEJsb2NrKHdvcmxkOlZlY3Rvcil7XHJcbiAgICAgICAgdmFyIHRvcGxlZnQgPSB0aGlzLndvcmxkMmluZGV4KHdvcmxkKS5zY2FsZSh0aGlzLnRpbGVzaXplKVxyXG4gICAgICAgIHJldHVybiBCbG9jay5mcm9tU2l6ZSh0b3BsZWZ0LG5ldyBWZWN0b3IodGhpcy50aWxlc2l6ZSx0aGlzLnRpbGVzaXplKSlcclxuICAgIH1cclxuXHJcbiAgICB3b3JsZDJpbmRleCh3b3JsZDpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gd29ybGQuYygpLmRpdihuZXcgVmVjdG9yKHRoaXMudGlsZXNpemUsdGhpcy50aWxlc2l6ZSkpLmZsb29yKClcclxuICAgIH1cclxuXHJcbiAgICBpbmRleDJ3b3JsZChpbmRleDpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gaW5kZXguYygpLnNjYWxlKHRoaXMudGlsZXNpemUpXHJcbiAgICB9XHJcblxyXG4gICAgZGVidWdEcmF3R3JpZChjdHh0OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCl7XHJcbiAgICAgICAgY3R4dC5maWxsU3R5bGUgPSAnYmxhY2snXHJcbiAgICAgICAgdGhpcy5ncmlkc2l6ZS5sb29wMmQoaSA9PiB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuaXNCbG9ja2VkSW5kZXgoaSkpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRCbG9jayh0aGlzLmluZGV4MndvcmxkKGkpKS5kcmF3KGN0eHQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGN0eHQuZmlsbFN0eWxlID0gJ2dyZXknXHJcbiAgICAgICAgZm9yKHZhciBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcyl7XHJcbiAgICAgICAgICAgIGVudGl0eS5ibG9jay5kcmF3KGN0eHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIGRlYnVnRHJhd1JheXMoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpe1xyXG4gICAgICAgIGZvcih2YXIgcmF5IG9mIHRoaXMuZmlyZWRSYXlzKXtcclxuICAgICAgICAgICAgaWYocmF5LmhpdCl7XHJcbiAgICAgICAgICAgICAgICBjdHh0LnN0cm9rZVN0eWxlID0gJ3JlZCdcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBjdHh0LnN0cm9rZVN0eWxlID0gJ2JsdWUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBkaXIgPSByYXkuZGlyLmMoKS5ub3JtYWxpemUoKVxyXG4gICAgICAgICAgICBsaW5lKGN0eHQscmF5Lm9yaWdpbixyYXkub3JpZ2luLmMoKS5hZGQoZGlyLnNjYWxlKDEwKSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBWRnJvbUF4aXNBbW91bnQoYXhpczpudW1iZXIsYW1vdW50Om51bWJlcil7XHJcbiAgICB2YXIgdiA9IG5ldyBWZWN0b3IoMCwwKVxyXG4gICAgdi52YWxzW2F4aXNdID0gYW1vdW50XHJcbiAgICByZXR1cm4gdlxyXG59XHJcblxyXG5mdW5jdGlvbiBjb2xsaWRlTGluZShhOlZlY3RvcixiOlZlY3Rvcixib3g6QmxvY2ssb3V0OltudW1iZXIsbnVtYmVyXSk6Ym9vbGVhbntcclxuICAgIHZhciBjbGlwMTpbbnVtYmVyLG51bWJlcl0gPSBbMCwwXVxyXG4gICAgdmFyIGNsaXAyOltudW1iZXIsbnVtYmVyXSA9IFswLDBdXHJcblxyXG4gICAgcmVsSW50ZXJzZWN0KGEueCxiLngsIGJveC5taW4ueCwgYm94Lm1heC54LCBjbGlwMSlcclxuICAgIHJlbEludGVyc2VjdChhLnksYi55LCBib3gubWluLnksIGJveC5tYXgueSwgY2xpcDIpXHJcbiAgICBcclxuICAgIC8vcmVzdWx0IGNvbnRhaW5zIGlmIHRoZSBsaW5lcyBpbnRlcnNlY3RlZFxyXG4gICAgdmFyIHJlc3VsdCA9IGludGVyc2VjdExpbmUoY2xpcDFbMF0sY2xpcDFbMV0sY2xpcDJbMF0sY2xpcDJbMV0sb3V0KVxyXG4gICAgcmV0dXJuIHJlc3VsdCAmJiBpblJhbmdlKDAsMSxvdXRbMF0pLy8gJiYgaW5SYW5nZSgwLDEsb3V0WzFdKVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWxJbnRlcnNlY3QoYW1pbjpudW1iZXIsYW1heDpudW1iZXIsYm1pbjpudW1iZXIsYm1heDpudW1iZXIsb3V0OltudW1iZXIsbnVtYmVyXSl7XHJcbiAgICBpZihhbWluID09IGFtYXgpey8vdGhpcyBjb3VsZCB1c2Ugc29tZSB3b3JrXHJcbiAgICAgICAgb3V0WzBdID0gLUluZmluaXR5XHJcbiAgICAgICAgb3V0WzFdID0gSW5maW5pdHlcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIHZhciBsZW5ndGggPSBNYXRoLmFicyh0byhhbWluLCBhbWF4KSlcclxuICAgIG91dFswXSA9IE1hdGguYWJzKHRvKGFtaW4sYm1pbikpIC8gbGVuZ3RoO1xyXG4gICAgb3V0WzFdID0gTWF0aC5hYnModG8oYW1pbixibWF4KSkgLyBsZW5ndGg7XHJcbiAgICBpZihvdXRbMF0gPiBvdXRbMV0pe1xyXG4gICAgICAgIHN3YXAob3V0LDAsMSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaW50ZXJzZWN0TGluZShhbWluOm51bWJlcixhbWF4Om51bWJlcixibWluOm51bWJlcixibWF4Om51bWJlcixvdXQ6W251bWJlcixudW1iZXJdKXtcclxuICAgIHZhciBpYmVnaW4gPSBNYXRoLm1heChhbWluLGJtaW4pXHJcbiAgICB2YXIgaWVuZCA9IE1hdGgubWluKGFtYXgsYm1heClcclxuICAgIG91dFswXSA9IGliZWdpblxyXG4gICAgb3V0WzFdID0gaWVuZFxyXG4gICAgaWYoaWJlZ2luIDw9IGllbmQpe1xyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3RvcHBpbmdGb3JjZSh2ZWw6VmVjdG9yLGR0Zm9yY2U6VmVjdG9yKXtcclxuICAgIHZlbC54ID0gbW92ZVRvd2FyZHModmVsLngsMCxkdGZvcmNlLngpXHJcbiAgICB2ZWwueSA9IG1vdmVUb3dhcmRzKHZlbC55LDAsZHRmb3JjZS55KVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW92ZVRvd2FyZHMoY3VyOm51bWJlcixkZXN0aW5hdGlvbjpudW1iZXIsbWF4YW1vdW50Om51bWJlcil7XHJcbiAgICB2YXIgZGlyID0gdG8oY3VyLGRlc3RpbmF0aW9uKVxyXG4gICAgaWYoTWF0aC5hYnMoZGlyKSA8PSBtYXhhbW91bnQpe1xyXG4gICAgICAgIHJldHVybiBkZXN0aW5hdGlvblxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgcmV0dXJuIGN1ciArIE1hdGguc2lnbihkaXIpICogbWF4YW1vdW50XHJcbiAgICB9XHJcbn0iXX0=
