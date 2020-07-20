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
        var slacksize = new vector_1.default(60, 30);
        // this.deadZone = new Block(halfsize.c().sub(slacksize), halfsize.c().add(slacksize))
        this.deadZone = new block_1.Block(slacksize.c().scale(-1), slacksize);
        this.screenshakeAnim.animType = utils_1.AnimType.once;
        this.screenshakeAnim.begin = 0;
        this.screenshakeAnim.end = 1;
    }
    update() {
        var target = this.focus.block.center();
        // target.add(this.focus.vel.c().sign().scale(50))
        // target.add(this.focus.vel.c().scale(0.2))
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
    // camera.debugdraw(ctxt)
    // world.debugDrawRays(ctxt)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJibG9jay50cyIsImNhbWVyYS50cyIsImV2ZW50c3lzdGVtLnRzIiwibWFpbi50cyIsInBsYXRmb3JtQ29udHJvbGxlci50cyIsInV0aWxzLnRzIiwidmVjdG9yLnRzIiwid29ybGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxzREFBNkI7QUFDN0IsbUNBQXdEO0FBRXhELE1BQWEsS0FBSztJQUNkLFlBQW1CLEdBQVUsRUFBUyxHQUFVO1FBQTdCLFFBQUcsR0FBSCxHQUFHLENBQU87UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUFPO0lBRWhELENBQUM7SUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQVUsRUFBQyxJQUFXO1FBQ2xDLE9BQU8sSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsU0FBUyxDQUFDLENBQVE7UUFDZCxPQUFPLElBQUksZ0JBQU0sQ0FDYixZQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUMvQixZQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNsQyxDQUFBO0lBQ0wsQ0FBQztJQUVELGtCQUFrQixDQUFDLENBQVE7UUFDdkIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzVCLENBQUM7SUFFRCxNQUFNO1FBQ0YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0JBQU0sQ0FBQyxHQUFHLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUM5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QUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFD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QUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNwQixDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsR0FBRyxDQUFDLENBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsS0FBSyxDQUFDLENBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBUTtRQUNQLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBRUQsS0FBSztRQUNELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFDbkQsQ0FBQztJQUVELElBQUk7UUFDQSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQ2xELENBQUM7SUFFRCxJQUFJO1FBQ0EsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUNsRCxDQUFDO0lBRUQsSUFBSSxDQUFDLENBQVEsRUFBQyxDQUFRO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzVDLENBQUM7SUFFRCxRQUFRO1FBQ0osSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1osS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFDO1lBQ3JDLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDckM7UUFDRCxPQUFPLEdBQUcsQ0FBQTtJQUNkLENBQUM7SUFFRCxNQUFNO1FBQ0YsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVB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QUMxQixPQUFPLFdBQVcsQ0FBQTtLQUNyQjtTQUFJO1FBQ0QsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUE7S0FDMUM7QUFDTCxDQUFDO0FBUEQsa0NBT0MiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgVmVjdG9yIGZyb20gXCIuL3ZlY3RvclwiXHJcbmltcG9ydCB7IGxlcnAsIGZpbGxSZWN0LCBpblJhbmdlLCBjbGFtcCB9IGZyb20gXCIuL3V0aWxzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBCbG9ja3tcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtaW46VmVjdG9yLCBwdWJsaWMgbWF4OlZlY3Rvcil7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBmcm9tU2l6ZShwb3M6VmVjdG9yLHNpemU6VmVjdG9yKXtcclxuICAgICAgICByZXR1cm4gbmV3IEJsb2NrKHBvcyxwb3MuYygpLmFkZChzaXplKSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb3JuZXIodjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcihcclxuICAgICAgICAgICAgbGVycCh0aGlzLm1pbi54LHRoaXMubWF4Lngsdi54KSxcclxuICAgICAgICAgICAgbGVycCh0aGlzLm1pbi55LHRoaXMubWF4Lnksdi55KSxcclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29ybmVyMENlbnRlcmVkKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVyKHYpXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMC41LDAuNSkpXHJcbiAgICB9XHJcblxyXG4gICAgc2V0KHY6VmVjdG9yLGNvcm5lcjpWZWN0b3Ipe1xyXG4gICAgICAgIHZhciBkaXNwbGFjZW1lbnQgPSB0aGlzLmdldENvcm5lcihjb3JuZXIpLnRvKHYpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW92ZShkaXNwbGFjZW1lbnQpXHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgbW92ZSh2OlZlY3Rvcil7XHJcbiAgICAgICAgdGhpcy5taW4uYWRkKHYpXHJcbiAgICAgICAgdGhpcy5tYXguYWRkKHYpXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBzaXplKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWluLnRvKHRoaXMubWF4KVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpe1xyXG4gICAgICAgIHZhciBzaXplID0gdGhpcy5zaXplKClcclxuICAgICAgICBmaWxsUmVjdChjdHh0LHRoaXMubWluLHNpemUpXHJcbiAgICB9XHJcblxyXG4gICAgYygpe1xyXG4gICAgICAgIHJldHVybiBuZXcgQmxvY2sodGhpcy5taW4uYygpLHRoaXMubWF4LmMoKSlcclxuICAgIH1cclxuXHJcbiAgICBjbGFtcCh2OlZlY3Rvcil7XHJcbiAgICAgICAgcmV0dXJuIHYubWFwKCh2YWwsYXJyLGkpID0+IGNsYW1wKHZhbCx0aGlzLm1pbi52YWxzW2ldLHRoaXMubWF4LnZhbHNbaV0pKVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyc2VjdFZlY3Rvcih2OlZlY3Rvcik6Ym9vbGVhbntcclxuICAgICAgICByZXR1cm4gaW5SYW5nZSh0aGlzLm1pbi54LHRoaXMubWF4Lngsdi54KSAmJiBpblJhbmdlKHRoaXMubWluLnksdGhpcy5tYXgueSx2LnkpXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBCbG9jayB9IGZyb20gXCIuL2Jsb2NrXCJcclxuaW1wb3J0IFZlY3RvciBmcm9tIFwiLi92ZWN0b3JcIlxyXG5pbXBvcnQgeyBFbnRpdHkgfSBmcm9tIFwiLi93b3JsZFwiXHJcbmltcG9ydCB7IEFuaW0sIEFuaW1UeXBlLCByb3VuZCwgVEFVLCBzdHJva2VSZWN0IH0gZnJvbSBcIi4vdXRpbHNcIlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2FtZXJhe1xyXG5cclxuICAgIFxyXG4gICAgXHJcbiAgICAvLyBvZmZzZXQ6VmVjdG9yXHJcbiAgICAvLyBjdXJyZW50VGFyZ2V0OlZlY3RvclxyXG4gICAgZGVhZFpvbmU6QmxvY2tcclxuICAgIHBvczpWZWN0b3JcclxuICAgIHRhcmdldDpWZWN0b3JcclxuXHJcbiAgICBzY3JlZW5zaGFrZUFuaW0gPSBuZXcgQW5pbSgpXHJcbiAgICB3b2JibGVzOm51bWJlciA9IDBcclxuICAgIHdvYmJsZWFtb3VudDpudW1iZXIgPSAwXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQscHVibGljIGZvY3VzOkVudGl0eSxwdWJsaWMgc2NyZWVuc2l6ZTpWZWN0b3Ipe1xyXG4gICAgICAgIHRoaXMucG9zID0gZm9jdXMuYmxvY2suY2VudGVyKClcclxuICAgICAgICAvLyB0aGlzLm9mZnNldCA9IHRoaXMuc2NyZWVuc2l6ZS5jKCkuc2NhbGUoMC41KS5zY2FsZSgtMSlcclxuICAgICAgICAvLyB2YXIgaGFsZnNpemUgPSB0aGlzLnNjcmVlbnNpemUuYygpLnNjYWxlKDAuNSlcclxuICAgICAgICB2YXIgc2xhY2tzaXplID0gbmV3IFZlY3Rvcig2MCwzMClcclxuICAgICAgICAvLyB0aGlzLmRlYWRab25lID0gbmV3IEJsb2NrKGhhbGZzaXplLmMoKS5zdWIoc2xhY2tzaXplKSwgaGFsZnNpemUuYygpLmFkZChzbGFja3NpemUpKVxyXG4gICAgICAgIHRoaXMuZGVhZFpvbmUgPSBuZXcgQmxvY2soc2xhY2tzaXplLmMoKS5zY2FsZSgtMSksc2xhY2tzaXplKVxyXG4gICAgICAgIHRoaXMuc2NyZWVuc2hha2VBbmltLmFuaW1UeXBlID0gQW5pbVR5cGUub25jZVxyXG4gICAgICAgIHRoaXMuc2NyZWVuc2hha2VBbmltLmJlZ2luID0gMFxyXG4gICAgICAgIHRoaXMuc2NyZWVuc2hha2VBbmltLmVuZCA9IDFcclxuICAgIH1cclxuXHJcbiAgICBcclxuXHJcbiAgICB1cGRhdGUoKXtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5mb2N1cy5ibG9jay5jZW50ZXIoKVxyXG4gICAgICAgIC8vIHRhcmdldC5hZGQodGhpcy5mb2N1cy52ZWwuYygpLnNpZ24oKS5zY2FsZSg1MCkpXHJcbiAgICAgICAgLy8gdGFyZ2V0LmFkZCh0aGlzLmZvY3VzLnZlbC5jKCkuc2NhbGUoMC4yKSlcclxuICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldFxyXG4gICAgICAgIHZhciBwb3MydGFyZ2V0ID0gdGhpcy5wb3MudG8odGFyZ2V0KVxyXG4gICAgICAgIHZhciBjbGFtcGVkcDJ0ID0gdGhpcy5kZWFkWm9uZS5jbGFtcChwb3MydGFyZ2V0LmMoKSlcclxuICAgICAgICB0aGlzLnBvcy5hZGQoY2xhbXBlZHAydC50byhwb3MydGFyZ2V0KSlcclxuXHJcblxyXG4gICAgICAgIHZhciBzY3JlZW5zaGFrZW9mZnNldCA9IG5ldyBWZWN0b3IoMCwwKVxyXG4gICAgICAgIHNjcmVlbnNoYWtlb2Zmc2V0LnkgPSBNYXRoLnNpbih0aGlzLnNjcmVlbnNoYWtlQW5pbS5nZXQoKSAqIHRoaXMud29iYmxlcykgKiB0aGlzLndvYmJsZWFtb3VudFxyXG4gICAgICAgIHRoaXMuc2V0Q2FtZXJhKHRoaXMucG9zLmMoKS5hZGQoc2NyZWVuc2hha2VvZmZzZXQpKVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzY3JlZW5zaGFrZShkdXJhdGlvbjpudW1iZXIsd29iYmxlczpudW1iZXIsd29iYmxlYW1vdW50Om51bWJlcil7XHJcbiAgICAgICAgdGhpcy53b2JibGVzID0gd29iYmxlc1xyXG4gICAgICAgIHRoaXMud29iYmxlYW1vdW50ID0gd29iYmxlYW1vdW50XHJcbiAgICAgICAgdGhpcy5zY3JlZW5zaGFrZUFuaW0uc3RvcHdhdGNoLnN0YXJ0KClcclxuICAgICAgICB0aGlzLnNjcmVlbnNoYWtlQW5pbS5kdXJhdGlvbiA9IGR1cmF0aW9uXHJcbiAgICAgICAgdGhpcy5zY3JlZW5zaGFrZUFuaW0uYmVnaW4gPSAwXHJcbiAgICAgICAgdGhpcy5zY3JlZW5zaGFrZUFuaW0uZW5kID0gVEFVXHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2FtZXJhKHBvczpWZWN0b3Ipe1xyXG4gICAgICAgIHRoaXMuY3R4dC5yZXNldFRyYW5zZm9ybSgpXHJcbiAgICAgICAgcG9zLnN1Yih0aGlzLnNjcmVlbnNpemUuYygpLnNjYWxlKDAuNSkpXHJcbiAgICAgICAgdGhpcy5jdHh0LnRyYW5zbGF0ZShyb3VuZCgtcG9zLngpLHJvdW5kKC1wb3MueSkpXHJcbiAgICB9XHJcblxyXG4gICAgZGVidWdkcmF3KGN0eHQ6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKXtcclxuICAgICAgICBjdHh0LnN0cm9rZVN0eWxlID0gJ2JsYWNrJ1xyXG4gICAgICAgIHN0cm9rZVJlY3QoY3R4dCx0aGlzLnBvcy5jKCkuYWRkKHRoaXMuZGVhZFpvbmUubWluKSx0aGlzLmRlYWRab25lLnNpemUoKSlcclxuICAgICAgICBjdHh0LmZpbGxTdHlsZSA9ICdyZWQnXHJcbiAgICAgICAgdGhpcy50YXJnZXQuZHJhdyhjdHh0KVxyXG4gICAgfVxyXG59IiwiZXhwb3J0IGNsYXNzIEJveDxUPntcclxuICAgIGJlZm9yZUNoYW5nZTpFdmVudFN5c3RlbTxUPiA9IG5ldyBFdmVudFN5c3RlbSgpXHJcbiAgICBhZnRlckNoYW5nZTpFdmVudFN5c3RlbTxUPiA9IG5ldyBFdmVudFN5c3RlbSgpXHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHZhbHVlOlQpe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXQoKTpUe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlXHJcbiAgICB9XHJcblxyXG4gICAgc2V0KHZhbDpUKXtcclxuICAgICAgICBpZih2YWwgIT0gdGhpcy52YWx1ZSl7XHJcbiAgICAgICAgICAgIHRoaXMuYmVmb3JlQ2hhbmdlLnRyaWdnZXIodGhpcy52YWx1ZSlcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbFxyXG4gICAgICAgICAgICB0aGlzLmFmdGVyQ2hhbmdlLnRyaWdnZXIodGhpcy52YWx1ZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQRXZlbnQ8VD57XHJcbiAgICBjYnNldDpTZXQ8RXZlbnRMaXN0ZW5lcjxUPj4gPSBuZXcgU2V0KClcclxuICAgIGhhbmRsZWQ6Ym9vbGVhbiA9IGZhbHNlXHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHZhbHVlOlQpe1xyXG5cclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBFdmVudExpc3RlbmVyPFQ+ID0gKHZhbDpULGU6UEV2ZW50PFQ+KSA9PiB2b2lkXHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRTeXN0ZW08VD57XHJcbiAgICBsaXN0ZW5lcnM6RXZlbnRMaXN0ZW5lcjxUPltdID0gW11cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBsaXN0ZW4oY2I6RXZlbnRMaXN0ZW5lcjxUPil7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaChjYilcclxuICAgIH1cclxuXHJcbiAgICB0cmlnZ2VyKHZhbDpUKXtcclxuICAgICAgICB0aGlzLmNvbnRpbnVlKG5ldyBQRXZlbnQodmFsKSkgXHJcbiAgICB9XHJcblxyXG4gICAgY29udGludWUoZTpQRXZlbnQ8VD4pe1xyXG4gICAgICAgIGZvciAodmFyIGNiIG9mIHRoaXMubGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIGlmKGUuY2JzZXQuaGFzKGNiKSA9PSBmYWxzZSl7XHJcbiAgICAgICAgICAgICAgICBlLmNic2V0LmFkZChjYilcclxuICAgICAgICAgICAgICAgIGNiKGUudmFsdWUsZSlcclxuICAgICAgICAgICAgICAgIGlmKGUuaGFuZGxlZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7bG9vcCwgY3JlYXRlQ2FudmFzLCBjbGFtcCwga2V5cywgZmxvb3IsIHJvdW5kLCBsaW5lLCBzdHJva2VSZWN0fSBmcm9tICcuL3V0aWxzJ1xyXG5pbXBvcnQge1dvcmxkLCBFbnRpdHl9IGZyb20gJy4vd29ybGQnXHJcbmltcG9ydCB7IFBsYXRmb3JtQ29udHJvbGxlciB9IGZyb20gJy4vcGxhdGZvcm1Db250cm9sbGVyJ1xyXG5pbXBvcnQgVmVjdG9yIGZyb20gJy4vdmVjdG9yJ1xyXG5pbXBvcnQgeyBCbG9jayB9IGZyb20gJy4vYmxvY2snXHJcbmltcG9ydCB7IFRvcERvd25Db250cm9sbGVyIH0gZnJvbSAnLi90b3Bkb3duQ29udHJvbGxlcidcclxuaW1wb3J0IENhbWVyYSBmcm9tICcuL2NhbWVyYSdcclxuXHJcbnZhciB4ID0gd2luZG93IGFzIGFueVxyXG54LmtleXMgPSBrZXlzXHJcblxyXG4vLyBrZXlzWydkJ10gPSB0cnVlXHJcbnZhciBncmlkID0gW1xyXG4gICAgWzEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDAsMCwwLDAsMSwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDEsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMSwxLDEsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwxLDBdLFxyXG4gICAgWzEsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMSwwLDAsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFsxLDAsMSwwLDAsMCwwLDAsMSwwLDAsMCwwLDEsMCwwLDAsMSwxLDFdLFxyXG5dXHJcbnZhciBncmlkc2l6ZSA9IG5ldyBWZWN0b3IoZ3JpZFswXS5sZW5ndGgsZ3JpZC5sZW5ndGgpXHJcbnZhciB3b3JsZCA9IG5ldyBXb3JsZChncmlkc2l6ZSw0MClcclxud29ybGQuZ3JpZCA9IGdyaWRcclxudmFyIHBsYXRmb3JtQ29udHJvbGxlciA9IG5ldyBQbGF0Zm9ybUNvbnRyb2xsZXIobmV3IEVudGl0eShCbG9jay5mcm9tU2l6ZShuZXcgVmVjdG9yKHdvcmxkLnRpbGVzaXplLHdvcmxkLnRpbGVzaXplKS5tdWwobmV3IFZlY3Rvcig4LDEyKSksIG5ldyBWZWN0b3IoNDAsNDApKSksd29ybGQpXHJcbi8vIHZhciB0b3Bkb3duQ29udHJvbGxlciA9IG5ldyBUb3BEb3duQ29udHJvbGxlcihuZXcgRW50aXR5KEJsb2NrLmZyb21TaXplKG5ldyBWZWN0b3Iod29ybGQudGlsZXNpemUsd29ybGQudGlsZXNpemUpLm11bChuZXcgVmVjdG9yKDEyLDEyKSksIG5ldyBWZWN0b3IoNDAsNDApKSksd29ybGQpXHJcbnZhciBzY3JlZW5zaXplID0gZ3JpZHNpemUuYygpLnNjYWxlKHdvcmxkLnRpbGVzaXplKS8vODAwIDcyMFxyXG52YXIge2NhbnZhcyxjdHh0fSA9IGNyZWF0ZUNhbnZhcyhzY3JlZW5zaXplLngsc2NyZWVuc2l6ZS55KVxyXG4vLyBwbGF0Zm9ybUNvbnRyb2xsZXIuYm9keS5ibG9jay5zZXQobmV3IFZlY3Rvcig0MCw0MCksbmV3IFZlY3RvcigwLDApKVxyXG4vLyBwbGF0Zm9ybUNvbnRyb2xsZXIuYm9keS5zcGVlZCA9IG5ldyBWZWN0b3IoMCwxMDApXHJcbnZhciBjYW1lcmEgPSBuZXcgQ2FtZXJhKGN0eHQscGxhdGZvcm1Db250cm9sbGVyLmJvZHksc2NyZWVuc2l6ZSlcclxueC5wbGF0Zm9ybUNvbnRyb2xsZXIgPSBwbGF0Zm9ybUNvbnRyb2xsZXJcclxubG9vcCgoZHQpID0+IHtcclxuICAgIGlmKGtleXNbJ3AnXSl7XHJcbiAgICAgICAgLy8ga2V5c1sncCddID0gZmFsc2VcclxuICAgICAgICAvLyBkZWJ1Z2dlclxyXG4gICAgICAgIGNhbWVyYS5zY3JlZW5zaGFrZSgxMDAwLDgsMjApXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGN0eHQucmVzZXRUcmFuc2Zvcm0oKVxyXG4gICAgY3R4dC5jbGVhclJlY3QoMCwwLHNjcmVlbnNpemUueCxzY3JlZW5zaXplLnkpXHJcbiAgICBcclxuICAgIGR0ID0gY2xhbXAoZHQsMC4wMDUsMC4xKVxyXG4gICAgd29ybGQudXBkYXRlKGR0KS8vYm9keSBnZXRzIG1vdmVkXHJcbiAgICBjYW1lcmEudXBkYXRlKClcclxuICAgIHdvcmxkLmRlYnVnRHJhd0dyaWQoY3R4dCkvL2JvZHkgZ2V0cyBkcmF3blxyXG4gICAgLy8gY2FtZXJhLmRlYnVnZHJhdyhjdHh0KVxyXG4gICAgLy8gd29ybGQuZGVidWdEcmF3UmF5cyhjdHh0KVxyXG4gICAgd29ybGQuZW1wdHlGaXJlZFJheXMoKVxyXG59KVxyXG5cclxuXHJcblxyXG5cclxuIiwiaW1wb3J0IHsgIFdvcmxkLCBFbnRpdHksIGFwcGx5U3RvcHBpbmdGb3JjZSB9IGZyb20gXCIuL3dvcmxkXCI7XHJcbmltcG9ydCBWZWN0b3IgZnJvbSBcIi4vdmVjdG9yXCI7XHJcbmltcG9ydCB7IGdldDJETW92ZUlucHV0WWZsaXBwZWQsIGtleXMsIGNsYW1wLCB0byB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUGxhdGZvcm1Db250cm9sbGVye1xyXG4gICAgZ3Jhdml0eTpWZWN0b3IgPSBuZXcgVmVjdG9yKDAsODAwKVxyXG4gICAganVtcHNwZWVkOm51bWJlciA9IDQwMFxyXG4gICAgXHJcbiAgICBhY2Nmb3JjZSA9IDMwMDBcclxuICAgIHBhc3NpdmVTdG9wRm9yY2UgPSAzMDAwXHJcbiAgICBhaXJhY2Nmb3JjZSA9IDEwMDBcclxuICAgIGFpcnBhc3NpdmVTdG9wRm9yY2UgPSAzNTBcclxuICAgIFxyXG4gICAganVtcE1heEFtbW8gPSAxXHJcbiAgICBqdW1wQW1tbyA9IHRoaXMuanVtcE1heEFtbW9cclxuICAgIGNsaW1iZm9yY2UgPSAyMDAwXHJcbiAgICB3YWxsaGFuZ1Jlc2V0c0p1bXBBbW1vID0gdHJ1ZVxyXG4gICAgY295b3RldGltZSA9IDAuM1xyXG4gICAgY295b3RldGltZXIgPSB0aGlzLmNveW90ZXRpbWVcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgYm9keTpFbnRpdHkscHVibGljICB3b3JsZDpXb3JsZCl7XHJcbiAgICAgICAgd29ybGQuZW50aXRpZXMucHVzaChib2R5KVxyXG5cclxuICAgICAgICB3b3JsZC5iZWZvcmVVcGRhdGUubGlzdGVuKChkdCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgaW5wdXQgPSBnZXQyRE1vdmVJbnB1dFlmbGlwcGVkKClcclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmJvZHkudmVsLmFkZCh0aGlzLmdyYXZpdHkuYygpLnNjYWxlKGR0KSlcclxuICAgICAgICAgICAgaWYoa2V5c1sndyddICYmIHRoaXMuYm9keS5ncm91bmRlZC55ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qdW1wKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL21vdmVcclxuICAgICAgICAgICAgaWYoaW5wdXQueCAhPSAwKXtcclxuICAgICAgICAgICAgICAgIHZhciBhY2NGb3JjZSA9IHRoaXMuYm9keS5ncm91bmRlZC55ID09IDAgPyB0aGlzLmFpcmFjY2ZvcmNlIDogdGhpcy5hY2Nmb3JjZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ib2R5LnZlbC54ICs9IGlucHV0LnggKiBhY2NGb3JjZSAqIGR0XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmdpbmcgPSB0aGlzLmlzSGFuZ2luZygpXHJcbiAgICAgICAgICAgICAgICBpZihoYW5naW5nICE9IDAgJiYgdGhpcy5ib2R5LnZlbC55ID4gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwbHlTdG9wcGluZ0ZvcmNlKHRoaXMuYm9keS52ZWwsbmV3IFZlY3RvcigwLHRoaXMuY2xpbWJmb3JjZSAqIGR0KSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL3Bhc3NpdmUgc3RvcFxyXG4gICAgICAgICAgICBpZihpbnB1dC54ID09IDApe1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0b3BzdHJlbmd0aCA9IHRoaXMuYm9keS5ncm91bmRlZC55ID09IDAgPyB0aGlzLmFpcnBhc3NpdmVTdG9wRm9yY2UgOiB0aGlzLnBhc3NpdmVTdG9wRm9yY2VcclxuICAgICAgICAgICAgICAgIGFwcGx5U3RvcHBpbmdGb3JjZSh0aGlzLmJvZHkudmVsLG5ldyBWZWN0b3Ioc3RvcHN0cmVuZ3RoICogZHQsMCkpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZihlLnJlcGVhdCB8fCB0aGlzLmJvZHkuZ3JvdW5kZWQueSA9PSAxKXsvL2dyb3VuZCBqdW1wcyBhcmUgZG9uZSBieSBwb2xsaW5nIGluIHVwZGF0ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoZS5rZXkgPT0gJyAnIHx8IGUua2V5ID09ICd3Jyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmp1bXAoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgd29ybGQuYWZ0ZXJVcGRhdGUubGlzdGVuKChkdCkgPT4ge1xyXG4gICAgICAgICAgICBpZih0aGlzLmJvZHkuZ3JvdW5kZWQueSA9PSAxKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuanVtcEFtbW8gPSB0aGlzLmp1bXBNYXhBbW1vXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYodGhpcy5ib2R5Lmdyb3VuZGVkLnggIT0gMCAmJiB0aGlzLndhbGxoYW5nUmVzZXRzSnVtcEFtbW8pe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qdW1wQW1tbyA9IHRoaXMuanVtcE1heEFtbW9cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jb3lvdGV0aW1lciAtPSBkdFxyXG4gICAgICAgICAgICBpZih0aGlzLmJvZHkuZ3JvdW5kZWQueSA9PSAxKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY295b3RldGltZXIgPSB0aGlzLmNveW90ZXRpbWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgXHJcblxyXG4gICAgXHJcbiAgICBqdW1wKCl7XHJcbiAgICAgICAgdmFyIGhhbmdpbmcgPSB0aGlzLmlzSGFuZ2luZygpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGp1bXAgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGhhbmdpbmcgIT0gMCAmJiB0aGlzLmJvZHkuZ3JvdW5kZWQueSA9PSAwKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuYm9keS52ZWwgPSBuZXcgVmVjdG9yKC1oYW5naW5nLC0xKS5ub3JtYWxpemUoKS5zY2FsZSh0aGlzLmp1bXBzcGVlZClcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJvZHkudmVsLnkgPSAtdGhpcy5qdW1wc3BlZWRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoaGFuZ2luZyAhPSAwIHx8IHRoaXMuYm9keS5ncm91bmRlZC55ID09IDEgfHwgdGhpcy5jb3lvdGV0aW1lciA+IDApe1xyXG4gICAgICAgICAgICBqdW1wKClcclxuICAgICAgICAgICAgdGhpcy5jb3lvdGV0aW1lciA9IDBcclxuICAgICAgICB9ZWxzZSBpZih0aGlzLmp1bXBBbW1vID4gMCl7XHJcbiAgICAgICAgICAgIGp1bXAoKVxyXG4gICAgICAgICAgICB0aGlzLmp1bXBBbW1vLS1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlzSGFuZ2luZygpOm51bWJlcntcclxuICAgICAgICB2YXIgaGFuZ2luZyA9IDBcclxuICAgICAgICBpZih0aGlzLndvcmxkLmJveENhc3QodGhpcy5ib2R5LmJsb2NrLDAsMC4wMSkuaGl0KXtcclxuICAgICAgICAgICAgaGFuZ2luZyA9IDFcclxuICAgICAgICB9ZWxzZSBpZih0aGlzLndvcmxkLmJveENhc3QodGhpcy5ib2R5LmJsb2NrLDAsLTAuMDEpLmhpdCl7XHJcbiAgICAgICAgICAgIGhhbmdpbmcgPSAtMVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaGFuZ2luZ1xyXG4gICAgfVxyXG4gICAgXHJcbn0iLCJpbXBvcnQgVmVjdG9yIGZyb20gXCIuL3ZlY3RvclwiO1xyXG5cclxudmFyIGxhc3RVcGRhdGUgPSBEYXRlLm5vdygpO1xyXG52YXIgVEFVID0gTWF0aC5QSSAqIDJcclxuZXhwb3J0IHtcclxuICAgIGtleXMsXHJcbiAgICBUQVUsXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb29wKGNhbGxiYWNrOihkdHNlY29uZHM6bnVtYmVyKSA9PiB2b2lkKXtcclxuICAgIHZhciBub3cgPSBEYXRlLm5vdygpXHJcbiAgICBjYWxsYmFjaygobm93IC0gbGFzdFVwZGF0ZSkgLyAxMDAwKVxyXG4gICAgbGFzdFVwZGF0ZSA9IG5vd1xyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuICAgICAgICBsb29wKGNhbGxiYWNrKVxyXG4gICAgfSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRiZXN0SW5kZXg8VD4obGlzdDpUW10sIGV2YWx1YXRvcjoodjpUKSA9PiBudW1iZXIpOm51bWJlciB7XHJcbiAgICBpZiAobGlzdC5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfVxyXG4gICAgdmFyIGJlc3RJbmRleCA9IDA7XHJcbiAgICB2YXIgYmVzdHNjb3JlID0gZXZhbHVhdG9yKGxpc3RbMF0pXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgc2NvcmUgPSBldmFsdWF0b3IobGlzdFtpXSlcclxuICAgICAgICBpZiAoc2NvcmUgPiBiZXN0c2NvcmUpIHtcclxuICAgICAgICAgICAgYmVzdHNjb3JlID0gc2NvcmVcclxuICAgICAgICAgICAgYmVzdEluZGV4ID0gaVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBiZXN0SW5kZXhcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRiZXN0PFQ+KGxpc3Q6VFtdLCBldmFsdWF0b3I6KHY6VCkgPT4gbnVtYmVyKTpUIHtcclxuICAgIHJldHVybiBsaXN0W2ZpbmRiZXN0SW5kZXgobGlzdCxldmFsdWF0b3IpXVxyXG59XHJcbnZhciBrZXlzID0ge31cclxuXHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XHJcbiAgICBrZXlzW2Uua2V5XSA9IHRydWVcclxufSlcclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZSA9PiB7XHJcbiAgICBrZXlzW2Uua2V5XSA9IGZhbHNlICBcclxufSlcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXQyRE1vdmVJbnB1dFlmbGlwcGVkKCl7XHJcbiAgICB2YXIgcmVzID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICBpZihrZXlzWyd3J10pe1xyXG4gICAgICAgIHJlcy55LS1cclxuICAgIH1cclxuICAgIGlmKGtleXNbJ3MnXSl7XHJcbiAgICAgICAgcmVzLnkrK1xyXG4gICAgfVxyXG4gICAgaWYoa2V5c1snYSddKXtcclxuICAgICAgICByZXMueC0tXHJcbiAgICB9XHJcbiAgICBpZihrZXlzWydkJ10pe1xyXG4gICAgICAgIHJlcy54KytcclxuICAgIH1cclxuICAgIHJldHVybiByZXNcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluUmFuZ2UobWluLG1heCx2KXtcclxuICAgIHJldHVybiB2ID49IG1pbiAmJiB2IDw9IG1heFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFwKHZhbDpudW1iZXIsZnJvbTE6bnVtYmVyLGZyb20yOm51bWJlcix0bzE6bnVtYmVyLHRvMjpudW1iZXIpOm51bWJlcntcclxuICAgIHJldHVybiBsZXJwKHRvMSx0bzIsaW52ZXJzZUxlcnAodmFsLGZyb20xLGZyb20yKSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludmVyc2VMZXJwKHZhbDpudW1iZXIsYTpudW1iZXIsYjpudW1iZXIpOm51bWJlcntcclxuICAgIHJldHVybiB0byhhLHZhbCkgLyB0byhhLGIpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0byhhOm51bWJlcixiOm51bWJlcil7XHJcbiAgICByZXR1cm4gYiAtIGFcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxlcnAoYTpudW1iZXIsYjpudW1iZXIsdDpudW1iZXIpe1xyXG4gICAgcmV0dXJuIGEgKyB0byhhLGIpICogdFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3dhcChhcnIsYSxiKXtcclxuICAgIHZhciB0ZW1wID0gYXJyW2FdXHJcbiAgICBhcnJbYV0gPSBhcnJbYl1cclxuICAgIGFycltiXSA9IHRlbXBcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbGxSZWN0KGN0eHQ6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELHBvczpWZWN0b3Isc2l6ZTpWZWN0b3Ipe1xyXG4gICAgY3R4dC5maWxsUmVjdChyb3VuZChwb3MueCksIHJvdW5kKHBvcy55KSwgc2l6ZS54LCBzaXplLnkpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdHJva2VSZWN0KGN0eHQ6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJELHBvczpWZWN0b3Isc2l6ZTpWZWN0b3Ipe1xyXG4gICAgY3R4dC5zdHJva2VSZWN0KHJvdW5kKHBvcy54KSArIDAuNSwgcm91bmQocG9zLnkpICsgMC41LCBzaXplLngsIHNpemUueSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxpbmUoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsb3JpZ2luOlZlY3RvcixkZXN0aW5hdGlvbjpWZWN0b3Ipe1xyXG4gICAgY3R4dC5iZWdpblBhdGgoKVxyXG4gICAgdmFyIGRpciA9IG9yaWdpbi50byhkZXN0aW5hdGlvbikubm9ybWFsaXplKCkuc2NhbGUoMC41KVxyXG4gICAgY3R4dC5tb3ZlVG8oTWF0aC5yb3VuZChvcmlnaW4ueCkgKyAwLjUgLSBkaXIueCxNYXRoLnJvdW5kKG9yaWdpbi55KSArIDAuNSAtIGRpci55KVxyXG4gICAgY3R4dC5saW5lVG8oTWF0aC5yb3VuZChkZXN0aW5hdGlvbi54KSArIDAuNSAgLSBkaXIueCxNYXRoLnJvdW5kKGRlc3RpbmF0aW9uLnkpICsgMC41IC0gZGlyLnkpXHJcbiAgICBjdHh0LnN0cm9rZSgpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW4yRGFycmF5PFQ+KHNpemU6VmVjdG9yLGNiOihpOlZlY3RvcikgPT4gVCk6VFtdW117XHJcbiAgICB2YXIgcmVzOlRbXVtdID0gW11cclxuICAgIHZhciBpbmRleCA9IG5ldyBWZWN0b3IoMCwwKVxyXG4gICAgZm9yKGluZGV4LnkgPSAwOyBpbmRleC55IDwgc2l6ZS55OyBpbmRleC55Kyspe1xyXG4gICAgICAgIHZhciByb3c6VFtdID0gW11cclxuICAgICAgICByZXMucHVzaChyb3cpXHJcbiAgICAgICAgZm9yKGluZGV4LnggPSAwOyBpbmRleC54IDwgc2l6ZS54OyBpbmRleC54Kyspe1xyXG4gICAgICAgICAgICByb3cucHVzaChjYihpbmRleCkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2FudmFzKHg6IG51bWJlciwgeTogbnVtYmVyKXtcclxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgY2FudmFzLndpZHRoID0geDtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSB5O1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpXHJcbiAgICB2YXIgY3R4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICByZXR1cm4ge2N0eHQ6Y3R4dCxjYW52YXM6Y2FudmFzfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKHZhbCxtaW4sbWF4KXtcclxuICAgIHJldHVybiBNYXRoLm1heChNYXRoLm1pbih2YWwsbWF4KSxtaW4pXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsZW5ndGhlbih2YWwsYW1vdW50KXtcclxuICAgIHJldHVybiB2YWwgKyBhbW91bnQgKiBNYXRoLnNpZ24odmFsKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmxvb3IodmFsKXtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKHZhbClcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNlaWwodmFsKXtcclxuICAgIHJldHVybiBNYXRoLmNlaWwodmFsKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcm91bmQodmFsKXtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbClcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSgpe1xyXG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKClcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1pbihhLGIpe1xyXG4gICAgcmV0dXJuIE1hdGgubWluKGEsYilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1heChhLGIpe1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KGEsYilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1vZChudW1iZXI6IG51bWJlciwgbW9kdWx1czogbnVtYmVyKXtcclxuICAgIHJldHVybiAoKG51bWJlciVtb2R1bHVzKSttb2R1bHVzKSVtb2R1bHVzO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3RvcFdhdGNoe1xyXG5cclxuICAgIHN0YXJ0dGltZXN0YW1wID0gRGF0ZS5ub3coKVxyXG4gICAgcGF1c2V0aW1lc3RhbXAgPSBEYXRlLm5vdygpXHJcbiAgICBwYXVzZXRpbWUgPSAwXHJcbiAgICBwYXVzZWQgPSB0cnVlXHJcblxyXG4gICAgZ2V0KCk6bnVtYmVye1xyXG4gICAgICAgIHZhciBjdXJyZW50YW1vdW50cGF1c2VkID0gMFxyXG4gICAgICAgIGlmKHRoaXMucGF1c2VkKXtcclxuICAgICAgICAgICAgY3VycmVudGFtb3VudHBhdXNlZCA9IHRvKHRoaXMucGF1c2V0aW1lc3RhbXAsRGF0ZS5ub3coKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvKHRoaXMuc3RhcnR0aW1lc3RhbXAsIERhdGUubm93KCkpIC0gKHRoaXMucGF1c2V0aW1lICsgY3VycmVudGFtb3VudHBhdXNlZClcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHN0YXJ0KCl7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMuc3RhcnR0aW1lc3RhbXAgPSBEYXRlLm5vdygpXHJcbiAgICAgICAgdGhpcy5wYXVzZXRpbWUgPSAwXHJcbiAgICB9XHJcblxyXG4gICAgY29udGludWUoKXtcclxuICAgICAgICBpZih0aGlzLnBhdXNlZCl7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2VcclxuICAgICAgICAgICAgdGhpcy5wYXVzZXRpbWUgKz0gdG8odGhpcy5wYXVzZXRpbWVzdGFtcCwgRGF0ZS5ub3coKSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcGF1c2UoKXtcclxuICAgICAgICBpZih0aGlzLnBhdXNlZCA9PSBmYWxzZSl7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZVxyXG4gICAgICAgICAgICB0aGlzLnBhdXNldGltZXN0YW1wID0gRGF0ZS5ub3coKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXNldCgpe1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuc3RhcnR0aW1lc3RhbXAgPSBEYXRlLm5vdygpXHJcbiAgICAgICAgdGhpcy5wYXVzZXRpbWVzdGFtcCA9IERhdGUubm93KClcclxuICAgICAgICB0aGlzLnBhdXNldGltZSA9IDBcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGVudW0gQW5pbVR5cGV7b25jZSxyZXBlYXQscGluZ3BvbmcsZXh0ZW5kfVxyXG5cclxuZXhwb3J0IGNsYXNzIEFuaW17XHJcbiAgICBhbmltVHlwZTpBbmltVHlwZSA9IEFuaW1UeXBlLm9uY2VcclxuICAgIHJldmVyc2U6Ym9vbGVhbiA9IGZhbHNlXHJcbiAgICBkdXJhdGlvbjpudW1iZXIgPSAxMDAwXHJcbiAgICBzdG9wd2F0Y2g6U3RvcFdhdGNoID0gbmV3IFN0b3BXYXRjaCgpXHJcbiAgICBiZWdpbjpudW1iZXIgPSAwXHJcbiAgICBlbmQ6bnVtYmVyID0gMVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldCgpOm51bWJlcntcclxuICAgICAgICB2YXIgY3ljbGVzID0gdGhpcy5zdG9wd2F0Y2guZ2V0KCkgLyB0aGlzLmR1cmF0aW9uXHJcblxyXG4gICAgICAgIHN3aXRjaCAodGhpcy5hbmltVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIEFuaW1UeXBlLm9uY2U6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xhbXAobGVycCh0aGlzLmJlZ2luLHRoaXMuZW5kLGN5Y2xlcyksdGhpcy5iZWdpbix0aGlzLmVuZCkgXHJcbiAgICAgICAgICAgIGNhc2UgQW5pbVR5cGUucmVwZWF0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlcnAodGhpcy5iZWdpbix0aGlzLmVuZCxtb2QoY3ljbGVzLDEpKVxyXG4gICAgICAgICAgICBjYXNlIEFuaW1UeXBlLnBpbmdwb25nOlxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YXIgcGluZ3BvbmdjeWNsZSA9IG1vZChjeWNsZXMsIDIpXHJcbiAgICAgICAgICAgICAgICBpZihwaW5ncG9uZ2N5Y2xlIDw9IDEpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZXJwKHRoaXMuYmVnaW4sdGhpcy5lbmQscGluZ3BvbmdjeWNsZSlcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZXJwKHRoaXMuZW5kLHRoaXMuYmVnaW4scGluZ3BvbmdjeWNsZSAtIDEpXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjYXNlIEFuaW1UeXBlLmV4dGVuZDpcclxuICAgICAgICAgICAgICAgIHZhciBkaXN0UGVyQ3ljbGUgPSB0byh0aGlzLmJlZ2luLHRoaXMuZW5kKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoY3ljbGVzKSAqIGRpc3RQZXJDeWNsZSArIGxlcnAodGhpcy5iZWdpbix0aGlzLmVuZCxtb2QoY3ljbGVzLDEpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyByb3VuZCB9IGZyb20gXCIuL3V0aWxzXCJcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlY3RvcntcclxuICAgIHZhbHM6bnVtYmVyW10gPSBbXVxyXG4gICAgY29uc3RydWN0b3IoeCwgeSwgeiA9IDApe1xyXG4gICAgICAgIHRoaXMudmFsc1swXSA9IHhcclxuICAgICAgICB0aGlzLnZhbHNbMV0gPSB5XHJcbiAgICAgICAgdGhpcy52YWxzWzJdID0gelxyXG4gICAgfVxyXG5cclxuICAgIGFkZCh2OlZlY3Rvcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiB2YWwgKyB2LnZhbHNbaV0pXHJcbiAgICB9XHJcblxyXG4gICAgc3ViKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IHZhbCAtIHYudmFsc1tpXSlcclxuICAgIH1cclxuXHJcbiAgICBtdWwodjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gdmFsICogdi52YWxzW2ldKVxyXG4gICAgfVxyXG5cclxuICAgIGRpdih2OlZlY3Rvcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiB2YWwgLyB2LnZhbHNbaV0pXHJcbiAgICB9XHJcblxyXG4gICAgc2NhbGUodjpudW1iZXIpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gdmFsICogdilcclxuICAgIH1cclxuXHJcbiAgICB0byh2OlZlY3Rvcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB2LmMoKS5zdWIodGhpcylcclxuICAgIH1cclxuXHJcbiAgICBmbG9vcigpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gTWF0aC5mbG9vcih2YWwpKVxyXG4gICAgfVxyXG5cclxuICAgIGNlaWwoKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IE1hdGguY2VpbCh2YWwpKVxyXG4gICAgfVxyXG5cclxuICAgIHNpZ24oKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IE1hdGguc2lnbih2YWwpKVxyXG4gICAgfVxyXG5cclxuICAgIGxlcnAodjpWZWN0b3IsdDpudW1iZXIpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5jKCkuYWRkKHRoaXMudG8odikuc2NhbGUodCkpXHJcbiAgICB9XHJcblxyXG4gICAgbGVuZ3Roc3EoKTpudW1iZXJ7XHJcbiAgICAgICAgdmFyIHN1bSA9IDA7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMudmFscy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIHN1bSArPSB0aGlzLnZhbHNbaV0gKiB0aGlzLnZhbHNbaV1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHN1bVxyXG4gICAgfVxyXG5cclxuICAgIGxlbmd0aCgpOm51bWJlcntcclxuICAgICAgICByZXR1cm4gTWF0aC5wb3codGhpcy5sZW5ndGhzcSgpLDAuNSlcclxuICAgIH1cclxuXHJcbiAgICBub3JtYWxpemUoKTpWZWN0b3J7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoKClcclxuICAgICAgICBpZihsZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxlKDApXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjYWxlKDEgLyBsZW5ndGgpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGMoKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IoMCwwKS5vdmVyd3JpdGUodGhpcylcclxuICAgIH1cclxuXHJcbiAgICBvdmVyd3JpdGUodjpWZWN0b3Ipe1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiB2LnZhbHNbaV0pXHJcbiAgICB9XHJcblxyXG4gICAgZG90KHY6VmVjdG9yKTpudW1iZXJ7XHJcbiAgICAgICAgdmFyIHN1bSA9IDBcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy52YWxzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgc3VtICs9IHRoaXMudmFsc1tpXSAqIHYudmFsc1tpXVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3VtXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KGk6bnVtYmVyKXtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWxzW2ldXHJcbiAgICB9XHJcblxyXG4gICAgc2V0KGk6bnVtYmVyLHZhbDpudW1iZXIpe1xyXG4gICAgICAgIHRoaXMudmFsc1tpXSA9IHZhbFxyXG4gICAgfVxyXG5cclxuICAgIGNyb3NzKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLnkgKiB2LnogLSB0aGlzLnogKiB2LnlcclxuICAgICAgICB2YXIgeSA9IHRoaXMueiAqIHYueCAtIHRoaXMueCAqIHYuelxyXG4gICAgICAgIHZhciB6ID0gdGhpcy54ICogdi55IC0gdGhpcy55ICogdi54XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IoeCx5LHopXHJcbiAgICB9XHJcblxyXG4gICAgcHJvamVjdE9udG8odjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdi5jKCkuc2NhbGUodGhpcy5kb3QodikgLyB2LmRvdCh2KSkgIFxyXG4gICAgfVxyXG5cclxuICAgIGxvb3AyZChjYjooaTpWZWN0b3IpID0+IHZvaWQpe1xyXG4gICAgICAgIHZhciBjb3VudGVyID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICAgICAgZm9yKGNvdW50ZXIueCA9IDA7IGNvdW50ZXIueCA8IHRoaXMueDsgY291bnRlci54Kyspe1xyXG4gICAgICAgICAgICBmb3IoY291bnRlci55ID0gMDsgY291bnRlci55IDwgdGhpcy55OyBjb3VudGVyLnkrKyl7XHJcbiAgICAgICAgICAgICAgICBjYihjb3VudGVyKVxyXG4gICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJvdGF0ZTJkKHJvdGF0aW9uczpudW1iZXIsb3JpZ2luOlZlY3RvciA9IG5ldyBWZWN0b3IoMCwwKSk6VmVjdG9ye1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpOlZlY3RvcntcclxuICAgICAgICB2YXIgd2lkdGggPSAxMFxyXG4gICAgICAgIHZhciBodyA9IHdpZHRoIC8gMlxyXG4gICAgICAgIGN0eHQuZmlsbFJlY3Qocm91bmQodGhpcy54IC0gaHcpLHJvdW5kKHRoaXMueSAtIGh3KSx3aWR0aCx3aWR0aCApXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBtYXAoY2I6KHZhbCxhcnJheSxpKSA9PiBudW1iZXIpOlZlY3RvcntcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy52YWxzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgIHRoaXMudmFsc1tpXSA9IGNiKHRoaXMudmFsc1tpXSx0aGlzLnZhbHMsaSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHNbMF1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgeSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHNbMV1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgeigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHNbMl1cclxuICAgIH1cclxuXHJcbiAgICBzZXQgeCh2YWwpe1xyXG4gICAgICAgIHRoaXMudmFsc1swXSA9IHZhbFxyXG4gICAgfVxyXG5cclxuICAgIHNldCB5KHZhbCl7XHJcbiAgICAgICAgdGhpcy52YWxzWzFdID0gdmFsXHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHoodmFsKXtcclxuICAgICAgICB0aGlzLnZhbHNbMl0gPSB2YWxcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciB6ZXJvID0gbmV3IFZlY3RvcigwLDApOyIsImltcG9ydCBWZWN0b3IgZnJvbSAnLi92ZWN0b3InXHJcbmltcG9ydCB7IGludmVyc2VMZXJwLCBmaW5kYmVzdCwgaW5SYW5nZSwgdG8sIHN3YXAsIGZpbmRiZXN0SW5kZXgsIGxpbmUsIGdlbjJEYXJyYXksIGxlcnAsIGxlbmd0aGVuLCBjbGFtcCwgY2VpbCB9IGZyb20gJy4vdXRpbHMnXHJcbmltcG9ydCB7IEV2ZW50U3lzdGVtLCBCb3ggfSBmcm9tICcuL2V2ZW50c3lzdGVtJ1xyXG5pbXBvcnQgeyBCbG9jayB9IGZyb20gJy4vYmxvY2snXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEVudGl0eXtcclxuICAgIGdyb3VuZGVkOlZlY3RvciA9IG5ldyBWZWN0b3IoMCwwKVxyXG4gICAgdmVsOlZlY3RvciA9IG5ldyBWZWN0b3IoMCwwKVxyXG4gICAgbWluc3BlZWQ6VmVjdG9yID0gbmV3IFZlY3RvcigtMzAwLC02MDApXHJcbiAgICBtYXhzcGVlZDpWZWN0b3IgPSBuZXcgVmVjdG9yKDMwMCw2MDApXHJcbiAgICBkaXI6VmVjdG9yID0gbmV3IFZlY3RvcigxLDApXHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIGJsb2NrOkJsb2NrKXtcclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCb3hjYXN0SGl0e1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHB1YmxpYyByYXlzOlJheWNhc3RIaXRbXSxcclxuICAgICAgICBwdWJsaWMgaGl0OmJvb2xlYW4sXHJcbiAgICAgICAgcHVibGljIGhpdHJheTpSYXljYXN0SGl0LFxyXG4gICAgKXtcclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSYXljYXN0SGl0e1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHB1YmxpYyBoaXQ6Ym9vbGVhbixcclxuICAgICAgICBwdWJsaWMgb3JpZ2luOlZlY3RvcixcclxuICAgICAgICBwdWJsaWMgZGlyOlZlY3RvcixcclxuICAgICAgICBwdWJsaWMgaGl0TG9jYXRpb246VmVjdG9yLFxyXG4gICAgICAgIHB1YmxpYyByZWxIaXRMb2NhdGlvbjpWZWN0b3IsXHJcbiAgICAgICAgcHVibGljIG5vcm1hbDpWZWN0b3IsXHJcbiAgICAgICAgcHVibGljIGhpdEluZGV4OlZlY3RvcixcclxuICAgICl7XHJcblxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBXb3JsZHtcclxuXHJcbiAgICBcclxuICAgIGdyaWQ6bnVtYmVyW11bXSA9IFtdXHJcbiAgICBlbnRpdGllczpFbnRpdHlbXSA9IFtdXHJcbiAgICBmaXJlZFJheXM6UmF5Y2FzdEhpdFtdID0gW11cclxuICAgIGJlZm9yZVVwZGF0ZSA9IG5ldyBFdmVudFN5c3RlbTxudW1iZXI+KClcclxuICAgIGFmdGVyVXBkYXRlID0gbmV3IEV2ZW50U3lzdGVtPG51bWJlcj4oKVxyXG4gICAgc2tpbndpZHRoID0gMC4wMVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBncmlkc2l6ZTpWZWN0b3IsIHB1YmxpYyB0aWxlc2l6ZTpudW1iZXIpe1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdlbjJEYXJyYXkoZ3JpZHNpemUsKCkgPT4gMClcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoZHRzZWNvbmRzOm51bWJlcil7XHJcbiAgICAgICAgdGhpcy5iZWZvcmVVcGRhdGUudHJpZ2dlcihkdHNlY29uZHMpXHJcbiAgICAgICAgZm9yKHZhciBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcyl7XHJcbiAgICAgICAgICAgIHZhciBzcGVlZCA9IGVudGl0eS52ZWwuYygpLnNjYWxlKGR0c2Vjb25kcylcclxuICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL2NsYW1wIHNwZWVkXHJcbiAgICAgICAgICAgIGVudGl0eS52ZWwubWFwKCh2YWwsYXJyLCBpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xhbXAodmFsLGVudGl0eS5taW5zcGVlZC5nZXQoaSksZW50aXR5Lm1heHNwZWVkLmdldChpKSlcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW92ZShlbnRpdHksc3BlZWQpXHJcbiAgICAgICAgICAgIGlmKHNwZWVkLmxlbmd0aHNxKCkgPiAwKXtcclxuICAgICAgICAgICAgICAgIGVudGl0eS5kaXIgPSBzcGVlZC5jKCkubm9ybWFsaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFmdGVyVXBkYXRlLnRyaWdnZXIoZHRzZWNvbmRzKVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmUoZW50aXR5OkVudGl0eSxhbW91bnQ6VmVjdG9yKXtcclxuICAgICAgICB0aGlzLm1vdmVBeGlzKGVudGl0eSwwLGFtb3VudC54KVxyXG4gICAgICAgIHRoaXMubW92ZUF4aXMoZW50aXR5LDEsYW1vdW50LnkpXHJcbiAgICB9XHJcblxyXG4gICAgbW92ZUF4aXMoZW50aXR5OkVudGl0eSxheGlzOm51bWJlcixhbW91bnQ6bnVtYmVyKXtcclxuICAgICAgICBpZihhbW91bnQgPT0gMCl7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaGl0ID0gdGhpcy5ib3hDYXN0KGVudGl0eS5ibG9jayxheGlzLGFtb3VudClcclxuICAgICAgICBlbnRpdHkuYmxvY2subW92ZShoaXQuaGl0cmF5LnJlbEhpdExvY2F0aW9uKVxyXG4gICAgICAgIGVudGl0eS5ncm91bmRlZC52YWxzW2F4aXNdID0gKGhpdC5oaXQgPyAxIDogMCkgKiBNYXRoLnNpZ24oYW1vdW50KVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGhpdC5oaXQpe1xyXG4gICAgICAgICAgICBlbnRpdHkudmVsLnZhbHNbYXhpc10gPSAwXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGJveENhc3QoYmxvY2s6QmxvY2ssYXhpczpudW1iZXIsYW1vdW50Om51bWJlcixfc2tpbndpZHRoID0gdGhpcy5za2lud2lkdGgpe1xyXG4gICAgICAgIHZhciBkaXIgPSBWRnJvbUF4aXNBbW91bnQoYXhpcyxhbW91bnQpXHJcbiAgICAgICAgaWYoYW1vdW50ID09IDApe1xyXG4gICAgICAgICAgICB2YXIgZHV0ID0gbmV3IFJheWNhc3RIaXQoZmFsc2UsYmxvY2suY2VudGVyKCksZGlyLG51bGwsbmV3IFZlY3RvcigwLDApLG51bGwsbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCb3hjYXN0SGl0KFtkdXRdLGZhbHNlLGR1dCkgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBza2luYmxvY2sgPSBibG9jay5jKClcclxuICAgICAgICBza2luYmxvY2subWluLmFkZChuZXcgVmVjdG9yKF9za2lud2lkdGgsX3NraW53aWR0aCkpXHJcbiAgICAgICAgc2tpbmJsb2NrLm1heC5zdWIobmV3IFZlY3Rvcihfc2tpbndpZHRoLF9za2lud2lkdGgpKVxyXG5cclxuICAgICAgICB2YXIgcG9pbnRzID0gdGhpcy5nZXRQb2ludHNPbkVkZ2Uoc2tpbmJsb2NrLGRpcilcclxuICAgICAgICB2YXIgcmF5cyA9IHBvaW50cy5tYXAocG9pbnQgPT4gdGhpcy5yYXljYXN0QXhpc0FsaWduZWQocG9pbnQsYXhpcyxsZW5ndGhlbihhbW91bnQsX3NraW53aWR0aCkpKVxyXG4gICAgICAgIHZhciBoaXRyYXkgPSBmaW5kYmVzdChyYXlzLmZpbHRlcihyYXkgPT4gcmF5LmhpdCkscmF5ID0+IC1yYXkucmVsSGl0TG9jYXRpb24ubGVuZ3RoKCkpXHJcbiAgICAgICAgZm9yKHZhciByYXkgb2YgcmF5cyl7XHJcbiAgICAgICAgICAgIHJheS5yZWxIaXRMb2NhdGlvbi52YWxzW2F4aXNdID0gbGVuZ3RoZW4ocmF5LnJlbEhpdExvY2F0aW9uLnZhbHNbYXhpc10sIC1fc2tpbndpZHRoKVxyXG4gICAgICAgICAgICB0aGlzLmZpcmVkUmF5cy5wdXNoKHJheSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3hjYXN0SGl0KHJheXMsaGl0cmF5Py5oaXQgPz8gZmFsc2UsaGl0cmF5ID8/IHJheXNbMF0pXHJcbiAgICB9XHJcblxyXG4gICAgcmF5Y2FzdEF4aXNBbGlnbmVkKG9yaWdpbldvcmxkOlZlY3RvcixheGlzLGFtb3VudCk6UmF5Y2FzdEhpdHtcclxuICAgICAgICB2YXIgZGlyV29ybGQgPSBWRnJvbUF4aXNBbW91bnQoYXhpcyxhbW91bnQpXHJcbiAgICAgICAgdmFyIGVuZCA9IG9yaWdpbldvcmxkLmMoKS5hZGQoZGlyV29ybGQpXHJcbiAgICAgICAgdmFyIGJveGVzMmNoZWNrID0gY2VpbChNYXRoLmFicyhhbW91bnQpIC8gdGhpcy50aWxlc2l6ZSlcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDw9IGJveGVzMmNoZWNrOyBpKyspe1xyXG4gICAgICAgICAgICB2YXIgcG9zID0gb3JpZ2luV29ybGQubGVycChlbmQsaSAvIGJveGVzMmNoZWNrKVxyXG4gICAgICAgICAgICBpZih0aGlzLmlzQmxvY2tlZChwb3MpKXtcclxuICAgICAgICAgICAgICAgIHZhciByYXljYXN0ID0gdGhpcy5yYXlDYXN0KG9yaWdpbldvcmxkLGRpcldvcmxkLHRoaXMuZ2V0QmxvY2socG9zKSlcclxuICAgICAgICAgICAgICAgIHJheWNhc3QuaGl0SW5kZXggPSB0aGlzLndvcmxkMmluZGV4KHBvcylcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXljYXN0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSYXljYXN0SGl0KGZhbHNlLG9yaWdpbldvcmxkLGRpcldvcmxkLG9yaWdpbldvcmxkLmMoKS5hZGQoZGlyV29ybGQpLGRpcldvcmxkLmMoKSxkaXJXb3JsZC5jKCkubm9ybWFsaXplKCkuc2NhbGUoLTEpLG51bGwpXHJcbiAgICB9XHJcblxyXG4gICAgcmF5Q2FzdChvcmlnaW46VmVjdG9yLGRpcjpWZWN0b3IsYmxvY2s6QmxvY2spe1xyXG4gICAgICAgIHZhciBlbmQgPSBvcmlnaW4uYygpLmFkZChkaXIpXHJcbiAgICAgICAgdmFyIHJlczpSYXljYXN0SGl0ID0gbmV3IFJheWNhc3RIaXQoZmFsc2Usb3JpZ2luLGRpcixudWxsLG51bGwsbnVsbCxudWxsKVxyXG5cclxuICAgICAgICB2YXIgb3V0OltudW1iZXIsbnVtYmVyXSA9IFswLDBdXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVzLmhpdCA9IGNvbGxpZGVMaW5lKG9yaWdpbixvcmlnaW4uYygpLmFkZChkaXIpLGJsb2NrLG91dClcclxuICAgICAgICByZXMuaGl0TG9jYXRpb24gPSBvcmlnaW4ubGVycChlbmQsb3V0WzBdKVxyXG4gICAgICAgIHJlcy5yZWxIaXRMb2NhdGlvbiA9IG9yaWdpbi50byhyZXMuaGl0TG9jYXRpb24pXHJcbiAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgfVxyXG5cclxuICAgIGdldFBvaW50c09uRWRnZShib3g6QmxvY2ssZGlyOlZlY3Rvcil7XHJcblxyXG4gICAgICAgIHZhciByZXM6VmVjdG9yW10gPSBbXVxyXG4gICAgICAgIHZhciBjb3JuZXJzID0gW1xyXG4gICAgICAgICAgICBib3guZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMCwwKSksXHJcbiAgICAgICAgICAgIGJveC5nZXRDb3JuZXIobmV3IFZlY3RvcigxLDApKSxcclxuICAgICAgICAgICAgYm94LmdldENvcm5lcihuZXcgVmVjdG9yKDEsMSkpLFxyXG4gICAgICAgICAgICBib3guZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMCwxKSksXHJcbiAgICAgICAgXVxyXG4gICAgICAgIGNvcm5lcnMgPSBjb3JuZXJzLmZpbHRlcihjb3JuZXIgPT4gYm94LmNlbnRlcigpLnRvKGNvcm5lcikubm9ybWFsaXplKCkuZG90KGRpci5jKCkubm9ybWFsaXplKCkpID4gMClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RhcnQgPSBjb3JuZXJzWzBdXHJcbiAgICAgICAgdmFyIGVuZCA9IGNvcm5lcnNbMV1cclxuICAgICAgICB2YXIgbm9mcG9pbnRzID0gY2VpbChzdGFydC50byhlbmQpLmxlbmd0aCgpIC8gdGhpcy50aWxlc2l6ZSkgKyAxXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG5vZnBvaW50cztpKyspe1xyXG4gICAgICAgICAgICByZXMucHVzaChzdGFydC5sZXJwKGVuZCwoaSAvIChub2Zwb2ludHMgLSAxKSkpKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBlbXB0eUZpcmVkUmF5cygpe1xyXG4gICAgICAgIHRoaXMuZmlyZWRSYXlzID0gW11cclxuICAgIH1cclxuXHJcbiAgICBpc0Jsb2NrZWQod29ybGQ6VmVjdG9yKXtcclxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLndvcmxkMmluZGV4KHdvcmxkKVxyXG4gICAgICAgIGlmKGluUmFuZ2UoMCx0aGlzLmdyaWRzaXplLnggLSAxLGluZGV4LngpICYmIGluUmFuZ2UoMCx0aGlzLmdyaWRzaXplLnkgLSAxLGluZGV4LnkpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZFtpbmRleC55XVtpbmRleC54XVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICBpc0Jsb2NrZWRJbmRleChpbmRleDpWZWN0b3Ipe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWRbaW5kZXgueV1baW5kZXgueF1cclxuICAgIH1cclxuXHJcbiAgICBnZXRCbG9jayh3b3JsZDpWZWN0b3Ipe1xyXG4gICAgICAgIHZhciB0b3BsZWZ0ID0gdGhpcy53b3JsZDJpbmRleCh3b3JsZCkuc2NhbGUodGhpcy50aWxlc2l6ZSlcclxuICAgICAgICByZXR1cm4gQmxvY2suZnJvbVNpemUodG9wbGVmdCxuZXcgVmVjdG9yKHRoaXMudGlsZXNpemUsdGhpcy50aWxlc2l6ZSkpXHJcbiAgICB9XHJcblxyXG4gICAgd29ybGQyaW5kZXgod29ybGQ6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHdvcmxkLmMoKS5kaXYobmV3IFZlY3Rvcih0aGlzLnRpbGVzaXplLHRoaXMudGlsZXNpemUpKS5mbG9vcigpXHJcbiAgICB9XHJcblxyXG4gICAgaW5kZXgyd29ybGQoaW5kZXg6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4LmMoKS5zY2FsZSh0aGlzLnRpbGVzaXplKVxyXG4gICAgfVxyXG5cclxuICAgIGRlYnVnRHJhd0dyaWQoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpe1xyXG4gICAgICAgIGN0eHQuZmlsbFN0eWxlID0gJ2JsYWNrJ1xyXG4gICAgICAgIHRoaXMuZ3JpZHNpemUubG9vcDJkKGkgPT4ge1xyXG4gICAgICAgICAgICBpZih0aGlzLmlzQmxvY2tlZEluZGV4KGkpKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0QmxvY2sodGhpcy5pbmRleDJ3b3JsZChpKSkuZHJhdyhjdHh0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjdHh0LmZpbGxTdHlsZSA9ICdncmV5J1xyXG4gICAgICAgIGZvcih2YXIgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpe1xyXG4gICAgICAgICAgICBlbnRpdHkuYmxvY2suZHJhdyhjdHh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBkZWJ1Z0RyYXdSYXlzKGN0eHQ6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKXtcclxuICAgICAgICBmb3IodmFyIHJheSBvZiB0aGlzLmZpcmVkUmF5cyl7XHJcbiAgICAgICAgICAgIGlmKHJheS5oaXQpe1xyXG4gICAgICAgICAgICAgICAgY3R4dC5zdHJva2VTdHlsZSA9ICdyZWQnXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgY3R4dC5zdHJva2VTdHlsZSA9ICdibHVlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgZGlyID0gcmF5LmRpci5jKCkubm9ybWFsaXplKClcclxuICAgICAgICAgICAgbGluZShjdHh0LHJheS5vcmlnaW4scmF5Lm9yaWdpbi5jKCkuYWRkKGRpci5zY2FsZSgxMCkpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gVkZyb21BeGlzQW1vdW50KGF4aXM6bnVtYmVyLGFtb3VudDpudW1iZXIpe1xyXG4gICAgdmFyIHYgPSBuZXcgVmVjdG9yKDAsMClcclxuICAgIHYudmFsc1theGlzXSA9IGFtb3VudFxyXG4gICAgcmV0dXJuIHZcclxufVxyXG5cclxuZnVuY3Rpb24gY29sbGlkZUxpbmUoYTpWZWN0b3IsYjpWZWN0b3IsYm94OkJsb2NrLG91dDpbbnVtYmVyLG51bWJlcl0pOmJvb2xlYW57XHJcbiAgICB2YXIgY2xpcDE6W251bWJlcixudW1iZXJdID0gWzAsMF1cclxuICAgIHZhciBjbGlwMjpbbnVtYmVyLG51bWJlcl0gPSBbMCwwXVxyXG5cclxuICAgIHJlbEludGVyc2VjdChhLngsYi54LCBib3gubWluLngsIGJveC5tYXgueCwgY2xpcDEpXHJcbiAgICByZWxJbnRlcnNlY3QoYS55LGIueSwgYm94Lm1pbi55LCBib3gubWF4LnksIGNsaXAyKVxyXG4gICAgXHJcbiAgICAvL3Jlc3VsdCBjb250YWlucyBpZiB0aGUgbGluZXMgaW50ZXJzZWN0ZWRcclxuICAgIHZhciByZXN1bHQgPSBpbnRlcnNlY3RMaW5lKGNsaXAxWzBdLGNsaXAxWzFdLGNsaXAyWzBdLGNsaXAyWzFdLG91dClcclxuICAgIHJldHVybiByZXN1bHQgJiYgaW5SYW5nZSgwLDEsb3V0WzBdKS8vICYmIGluUmFuZ2UoMCwxLG91dFsxXSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsSW50ZXJzZWN0KGFtaW46bnVtYmVyLGFtYXg6bnVtYmVyLGJtaW46bnVtYmVyLGJtYXg6bnVtYmVyLG91dDpbbnVtYmVyLG51bWJlcl0pe1xyXG4gICAgaWYoYW1pbiA9PSBhbWF4KXsvL3RoaXMgY291bGQgdXNlIHNvbWUgd29ya1xyXG4gICAgICAgIG91dFswXSA9IC1JbmZpbml0eVxyXG4gICAgICAgIG91dFsxXSA9IEluZmluaXR5XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5hYnModG8oYW1pbiwgYW1heCkpXHJcbiAgICBvdXRbMF0gPSBNYXRoLmFicyh0byhhbWluLGJtaW4pKSAvIGxlbmd0aDtcclxuICAgIG91dFsxXSA9IE1hdGguYWJzKHRvKGFtaW4sYm1heCkpIC8gbGVuZ3RoO1xyXG4gICAgaWYob3V0WzBdID4gb3V0WzFdKXtcclxuICAgICAgICBzd2FwKG91dCwwLDEpXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGludGVyc2VjdExpbmUoYW1pbjpudW1iZXIsYW1heDpudW1iZXIsYm1pbjpudW1iZXIsYm1heDpudW1iZXIsb3V0OltudW1iZXIsbnVtYmVyXSl7XHJcbiAgICB2YXIgaWJlZ2luID0gTWF0aC5tYXgoYW1pbixibWluKVxyXG4gICAgdmFyIGllbmQgPSBNYXRoLm1pbihhbWF4LGJtYXgpXHJcbiAgICBvdXRbMF0gPSBpYmVnaW5cclxuICAgIG91dFsxXSA9IGllbmRcclxuICAgIGlmKGliZWdpbiA8PSBpZW5kKXtcclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0b3BwaW5nRm9yY2UodmVsOlZlY3RvcixkdGZvcmNlOlZlY3Rvcil7XHJcbiAgICB2ZWwueCA9IG1vdmVUb3dhcmRzKHZlbC54LDAsZHRmb3JjZS54KVxyXG4gICAgdmVsLnkgPSBtb3ZlVG93YXJkcyh2ZWwueSwwLGR0Zm9yY2UueSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1vdmVUb3dhcmRzKGN1cjpudW1iZXIsZGVzdGluYXRpb246bnVtYmVyLG1heGFtb3VudDpudW1iZXIpe1xyXG4gICAgdmFyIGRpciA9IHRvKGN1cixkZXN0aW5hdGlvbilcclxuICAgIGlmKE1hdGguYWJzKGRpcikgPD0gbWF4YW1vdW50KXtcclxuICAgICAgICByZXR1cm4gZGVzdGluYXRpb25cclxuICAgIH1lbHNle1xyXG4gICAgICAgIHJldHVybiBjdXIgKyBNYXRoLnNpZ24oZGlyKSAqIG1heGFtb3VudFxyXG4gICAgfVxyXG59Il19
