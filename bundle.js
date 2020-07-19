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
}
exports.Block = Block;
},{"./utils":5,"./vector":6}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSystem = exports.PEvent = exports.Box = void 0;
class Box {
    constructor() {
        this.beforeChange = new EventSystem();
        this.afterChange = new EventSystem();
    }
    get() {
        return this.value;
    }
    set(val) {
        this.beforeChange.trigger(this.value);
        this.value = val;
        this.afterChange.trigger(this.value);
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
},{}],3:[function(require,module,exports){
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
var x = window;
x.keys = utils_1.keys;
// keys['d'] = true
var grid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
var platformController = new platformController_1.PlatformController(new world_1.Entity(block_1.Block.fromSize(new vector_1.default(world.tilesize, world.tilesize).mul(new vector_1.default(12, 12)), new vector_1.default(40, 40))), world);
// var topdownController = new TopDownController(new Entity(Block.fromSize(new Vector(world.tilesize,world.tilesize).mul(new Vector(12,12)), new Vector(40,40))),world)
var screensize = gridsize.c().scale(world.tilesize);
var { canvas, ctxt } = utils_1.createCanvas(screensize.x, screensize.y);
// platformController.body.block.set(new Vector(40,40),new Vector(0,0))
// platformController.body.speed = new Vector(0,100)
utils_1.loop((dt) => {
    if (utils_1.keys['p']) {
        utils_1.keys['p'] = false;
        debugger;
    }
    ctxt.resetTransform();
    ctxt.clearRect(0, 0, screensize.x, screensize.y);
    setCamera(platformController.body.block.center());
    // setCamera(screensize.c().scale(0.5))
    dt = utils_1.clamp(dt, 0.005, 0.1);
    world.update(dt);
    world.debugDrawGrid(ctxt);
    // world.debugDrawRays(ctxt)
    world.emptyFiredRays();
});
function setCamera(pos) {
    ctxt.resetTransform();
    pos.sub(screensize.c().scale(0.5));
    // pos.add
    ctxt.translate(utils_1.round(-pos.x), utils_1.round(-pos.y));
}
},{"./block":1,"./platformController":4,"./utils":5,"./vector":6,"./world":7}],4:[function(require,module,exports){
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
        this.fallStart = 0;
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
            if (e.repeat) {
                return;
            }
            if (e.key == ' ' || e.key == 'w') {
                this.jump();
            }
        });
        world.afterUpdate.listen(() => {
            if (this.body.grounded.y == 1) {
                this.jumpAmmo = this.jumpMaxAmmo;
            }
            if (this.body.grounded.x != 0 && this.wallhangResetsJumpAmmo) {
                this.jumpAmmo = this.jumpMaxAmmo;
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
        if (hanging != 0 || this.body.grounded.y == 1) {
            jump();
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
},{"./utils":5,"./vector":6,"./world":7}],5:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.max = exports.min = exports.random = exports.round = exports.ceil = exports.floor = exports.lengthen = exports.clamp = exports.createCanvas = exports.gen2Darray = exports.line = exports.fillRect = exports.swap = exports.lerp = exports.to = exports.inverseLerp = exports.map = exports.inRange = exports.get2DMoveInputYflipped = exports.findbest = exports.findbestIndex = exports.loop = exports.TAU = exports.keys = void 0;
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
},{"./vector":6}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zero = void 0;
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
        return this.scale(1 / this.length());
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
},{}],7:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTowards = exports.applyStoppingForce = exports.World = exports.RaycastHit = exports.Entity = void 0;
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
        entity.block.move(hit.relHitLocation);
        entity.grounded.vals[axis] = (hit.hit ? 1 : 0) * Math.sign(amount);
        if (hit.hit) {
            entity.vel.vals[axis] = 0;
        }
    }
    boxCast(block, axis, amount, _skinwidth = this.skinwidth) {
        var dir = VFromAxisAmount(axis, amount);
        if (amount == 0) {
            return new RaycastHit(false, block.center(), dir, null, new vector_1.default(0, 0), null, null);
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
        return hitray ?? rays[0];
    }
    raycastAxisAligned(originWorld, axis, amount) {
        var dirWorld = VFromAxisAmount(axis, amount);
        var end = originWorld.c().add(dirWorld);
        var boxes2check = utils_1.ceil(Math.abs(amount) / this.tilesize);
        for (var i = 0; i <= boxes2check; i++) {
            var pos = originWorld.lerp(end, i / boxes2check);
            if (this.isBlocked(pos)) {
                return this.rayCast(originWorld, dirWorld, this.getBlock(pos));
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
    if (amin > amax) {
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
},{"./block":1,"./eventsystem":2,"./utils":5,"./vector":6}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJibG9jay50cyIsImV2ZW50c3lzdGVtLnRzIiwibWFpbi50cyIsInBsYXRmb3JtQ29udHJvbGxlci50cyIsInV0aWxzLnRzIiwidmVjdG9yLnRzIiwid29ybGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxzREFBNkI7QUFDN0IsbUNBQXdDO0FBRXhDLE1BQWEsS0FBSztJQUNkLFlBQW1CLEdBQVUsRUFBUyxHQUFVO1FBQTdCLFFBQUcsR0FBSCxHQUFHLENBQU87UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUFPO0lBRWhELENBQUM7SUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQVUsRUFBQyxJQUFXO1FBQ2xDLE9BQU8sSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsU0FBUyxDQUFDLENBQVE7UUFDZCxPQUFPLElBQUksZ0JBQU0sQ0FDYixZQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUMvQixZQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNsQyxDQUFBO0lBQ0wsQ0FBQztJQUVELE1BQU07UUFDRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxnQkFBTSxDQUFDLEdBQUcsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFFRCxHQUFHLENBQUMsQ0FBUSxFQUFDLE1BQWE7UUFDdEIsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FB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QUE7QUFDYixtQkFBbUI7QUFDbkIsSUFBSSxJQUFJLEdBQUc7SUFDUCxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFB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Q0FBQyxDQUFRO1FBQ1IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDbkQsQ0FBQztJQUVELEtBQUssQ0FBQyxDQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQVE7UUFDUCxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUVELEtBQUs7UUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQ25ELENBQUM7SUFFRCxJQUFJO1FBQ0EsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUNsRCxDQUFDO0lBRUQsSUFBSSxDQUFDLENBQVEsRUFBQyxDQUFRO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzVDLENBQUM7SUFFRCxRQUFRO1FBQ0osSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1osS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFB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Q0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdEMsR0FBRyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzFDLENBQUM7QUFIRCxnREFHQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxHQUFVLEVBQUMsV0FBa0IsRUFBQyxTQUFnQjtJQUN0RSxJQUFJLEdBQUcsR0FBRyxVQUFFLENBQUMsR0FBRyxFQUFDLFdBQVcsQ0FBQyxDQUFBO0lBQzdCLElBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFTLEVBQUM7UUFDMUIsT0FBTyxXQUFXLENBQUE7S0FDckI7U0FBSTtRQUNELE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFBO0tBQzFDO0FBQ0wsQ0FBQztBQVBELGtDQU9DIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IFZlY3RvciBmcm9tIFwiLi92ZWN0b3JcIlxyXG5pbXBvcnQgeyBsZXJwLCBmaWxsUmVjdCB9IGZyb20gXCIuL3V0aWxzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBCbG9ja3tcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtaW46VmVjdG9yLCBwdWJsaWMgbWF4OlZlY3Rvcil7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBmcm9tU2l6ZShwb3M6VmVjdG9yLHNpemU6VmVjdG9yKXtcclxuICAgICAgICByZXR1cm4gbmV3IEJsb2NrKHBvcyxwb3MuYygpLmFkZChzaXplKSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb3JuZXIodjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcihcclxuICAgICAgICAgICAgbGVycCh0aGlzLm1pbi54LHRoaXMubWF4Lngsdi54KSxcclxuICAgICAgICAgICAgbGVycCh0aGlzLm1pbi55LHRoaXMubWF4Lnksdi55KSxcclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMC41LDAuNSkpXHJcbiAgICB9XHJcblxyXG4gICAgc2V0KHY6VmVjdG9yLGNvcm5lcjpWZWN0b3Ipe1xyXG4gICAgICAgIHZhciBkaXNwbGFjZW1lbnQgPSB0aGlzLmdldENvcm5lcihjb3JuZXIpLnRvKHYpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW92ZShkaXNwbGFjZW1lbnQpXHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgbW92ZSh2OlZlY3Rvcil7XHJcbiAgICAgICAgdGhpcy5taW4uYWRkKHYpXHJcbiAgICAgICAgdGhpcy5tYXguYWRkKHYpXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBzaXplKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWluLnRvKHRoaXMubWF4KVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpe1xyXG4gICAgICAgIHZhciBzaXplID0gdGhpcy5zaXplKClcclxuICAgICAgICBmaWxsUmVjdChjdHh0LHRoaXMubWluLHNpemUpXHJcbiAgICB9XHJcblxyXG4gICAgYygpe1xyXG4gICAgICAgIHJldHVybiBuZXcgQmxvY2sodGhpcy5taW4uYygpLHRoaXMubWF4LmMoKSlcclxuICAgIH1cclxufSIsImV4cG9ydCBjbGFzcyBCb3g8VD57XHJcbiAgICB2YWx1ZTpUXHJcbiAgICBiZWZvcmVDaGFuZ2U6RXZlbnRTeXN0ZW08VD4gPSBuZXcgRXZlbnRTeXN0ZW0oKVxyXG4gICAgYWZ0ZXJDaGFuZ2U6RXZlbnRTeXN0ZW08VD4gPSBuZXcgRXZlbnRTeXN0ZW0oKVxyXG5cclxuICAgIGdldCgpOlR7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVcclxuICAgIH1cclxuXHJcbiAgICBzZXQodmFsOlQpe1xyXG4gICAgICAgIHRoaXMuYmVmb3JlQ2hhbmdlLnRyaWdnZXIodGhpcy52YWx1ZSlcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsXHJcbiAgICAgICAgdGhpcy5hZnRlckNoYW5nZS50cmlnZ2VyKHRoaXMudmFsdWUpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQRXZlbnQ8VD57XHJcbiAgICBjYnNldDpTZXQ8RXZlbnRMaXN0ZW5lcjxUPj4gPSBuZXcgU2V0KClcclxuICAgIGhhbmRsZWQ6Ym9vbGVhbiA9IGZhbHNlXHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHZhbHVlOlQpe1xyXG5cclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBFdmVudExpc3RlbmVyPFQ+ID0gKHZhbDpULGU6UEV2ZW50PFQ+KSA9PiB2b2lkXHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRTeXN0ZW08VD57XHJcbiAgICBsaXN0ZW5lcnM6RXZlbnRMaXN0ZW5lcjxUPltdID0gW11cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBsaXN0ZW4oY2I6RXZlbnRMaXN0ZW5lcjxUPil7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaChjYilcclxuICAgIH1cclxuXHJcbiAgICB0cmlnZ2VyKHZhbDpUKXtcclxuICAgICAgICB0aGlzLmNvbnRpbnVlKG5ldyBQRXZlbnQodmFsKSkgXHJcbiAgICB9XHJcblxyXG4gICAgY29udGludWUoZTpQRXZlbnQ8VD4pe1xyXG4gICAgICAgIGZvciAodmFyIGNiIG9mIHRoaXMubGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIGlmKGUuY2JzZXQuaGFzKGNiKSA9PSBmYWxzZSl7XHJcbiAgICAgICAgICAgICAgICBlLmNic2V0LmFkZChjYilcclxuICAgICAgICAgICAgICAgIGNiKGUudmFsdWUsZSlcclxuICAgICAgICAgICAgICAgIGlmKGUuaGFuZGxlZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7bG9vcCwgY3JlYXRlQ2FudmFzLCBjbGFtcCwga2V5cywgZmxvb3IsIHJvdW5kfSBmcm9tICcuL3V0aWxzJ1xyXG5pbXBvcnQge1dvcmxkLCBFbnRpdHl9IGZyb20gJy4vd29ybGQnXHJcbmltcG9ydCB7IFBsYXRmb3JtQ29udHJvbGxlciB9IGZyb20gJy4vcGxhdGZvcm1Db250cm9sbGVyJ1xyXG5pbXBvcnQgVmVjdG9yIGZyb20gJy4vdmVjdG9yJ1xyXG5pbXBvcnQgeyBCbG9jayB9IGZyb20gJy4vYmxvY2snXHJcbmltcG9ydCB7IFRvcERvd25Db250cm9sbGVyIH0gZnJvbSAnLi90b3Bkb3duQ29udHJvbGxlcidcclxuXHJcbnZhciB4ID0gd2luZG93IGFzIGFueVxyXG54LmtleXMgPSBrZXlzXHJcbi8vIGtleXNbJ2QnXSA9IHRydWVcclxudmFyIGdyaWQgPSBbXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwxLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMSwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwxLDEsMSwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDEsMF0sXHJcbiAgICBbMSwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFsxLDAsMCwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMCwxLDBdLFxyXG4gICAgWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMF0sXHJcbiAgICBbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwXSxcclxuICAgIFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDBdLFxyXG4gICAgWzEsMCwxLDAsMCwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwxLDEsMV0sXHJcbl1cclxudmFyIGdyaWRzaXplID0gbmV3IFZlY3RvcihncmlkWzBdLmxlbmd0aCxncmlkLmxlbmd0aClcclxudmFyIHdvcmxkID0gbmV3IFdvcmxkKGdyaWRzaXplLDQwKVxyXG53b3JsZC5ncmlkID0gZ3JpZFxyXG52YXIgcGxhdGZvcm1Db250cm9sbGVyID0gbmV3IFBsYXRmb3JtQ29udHJvbGxlcihuZXcgRW50aXR5KEJsb2NrLmZyb21TaXplKG5ldyBWZWN0b3Iod29ybGQudGlsZXNpemUsd29ybGQudGlsZXNpemUpLm11bChuZXcgVmVjdG9yKDEyLDEyKSksIG5ldyBWZWN0b3IoNDAsNDApKSksd29ybGQpXHJcbi8vIHZhciB0b3Bkb3duQ29udHJvbGxlciA9IG5ldyBUb3BEb3duQ29udHJvbGxlcihuZXcgRW50aXR5KEJsb2NrLmZyb21TaXplKG5ldyBWZWN0b3Iod29ybGQudGlsZXNpemUsd29ybGQudGlsZXNpemUpLm11bChuZXcgVmVjdG9yKDEyLDEyKSksIG5ldyBWZWN0b3IoNDAsNDApKSksd29ybGQpXHJcbnZhciBzY3JlZW5zaXplID0gZ3JpZHNpemUuYygpLnNjYWxlKHdvcmxkLnRpbGVzaXplKVxyXG52YXIge2NhbnZhcyxjdHh0fSA9IGNyZWF0ZUNhbnZhcyhzY3JlZW5zaXplLngsc2NyZWVuc2l6ZS55KVxyXG4vLyBwbGF0Zm9ybUNvbnRyb2xsZXIuYm9keS5ibG9jay5zZXQobmV3IFZlY3Rvcig0MCw0MCksbmV3IFZlY3RvcigwLDApKVxyXG4vLyBwbGF0Zm9ybUNvbnRyb2xsZXIuYm9keS5zcGVlZCA9IG5ldyBWZWN0b3IoMCwxMDApXHJcblxyXG5cclxubG9vcCgoZHQpID0+IHtcclxuICAgIGlmKGtleXNbJ3AnXSl7XHJcbiAgICAgICAga2V5c1sncCddID0gZmFsc2VcclxuICAgICAgICBkZWJ1Z2dlclxyXG4gICAgfVxyXG4gICAgY3R4dC5yZXNldFRyYW5zZm9ybSgpXHJcbiAgICBjdHh0LmNsZWFyUmVjdCgwLDAsc2NyZWVuc2l6ZS54LHNjcmVlbnNpemUueSlcclxuICAgIHNldENhbWVyYShwbGF0Zm9ybUNvbnRyb2xsZXIuYm9keS5ibG9jay5jZW50ZXIoKSlcclxuICAgIC8vIHNldENhbWVyYShzY3JlZW5zaXplLmMoKS5zY2FsZSgwLjUpKVxyXG5cclxuICAgIGR0ID0gY2xhbXAoZHQsMC4wMDUsMC4xKVxyXG4gICAgd29ybGQudXBkYXRlKGR0KVxyXG4gICAgXHJcbiAgICB3b3JsZC5kZWJ1Z0RyYXdHcmlkKGN0eHQpXHJcbiAgICAvLyB3b3JsZC5kZWJ1Z0RyYXdSYXlzKGN0eHQpXHJcbiAgICB3b3JsZC5lbXB0eUZpcmVkUmF5cygpXHJcbn0pXHJcblxyXG5mdW5jdGlvbiBzZXRDYW1lcmEocG9zOlZlY3Rvcil7XHJcbiAgICBjdHh0LnJlc2V0VHJhbnNmb3JtKClcclxuICAgIHBvcy5zdWIoc2NyZWVuc2l6ZS5jKCkuc2NhbGUoMC41KSlcclxuICAgIC8vIHBvcy5hZGRcclxuICAgIGN0eHQudHJhbnNsYXRlKHJvdW5kKC1wb3MueCkscm91bmQoLXBvcy55KSlcclxufVxyXG5cclxuXHJcbiIsImltcG9ydCB7ICBXb3JsZCwgRW50aXR5LCBhcHBseVN0b3BwaW5nRm9yY2UgfSBmcm9tIFwiLi93b3JsZFwiO1xyXG5pbXBvcnQgVmVjdG9yIGZyb20gXCIuL3ZlY3RvclwiO1xyXG5pbXBvcnQgeyBnZXQyRE1vdmVJbnB1dFlmbGlwcGVkLCBrZXlzLCBjbGFtcCwgdG8gfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBsYXRmb3JtQ29udHJvbGxlcntcclxuICAgIGdyYXZpdHk6VmVjdG9yID0gbmV3IFZlY3RvcigwLDgwMClcclxuICAgIGp1bXBzcGVlZDpudW1iZXIgPSA0MDBcclxuICAgIFxyXG4gICAgYWNjZm9yY2UgPSAzMDAwXHJcbiAgICBwYXNzaXZlU3RvcEZvcmNlID0gMzAwMFxyXG4gICAgYWlyYWNjZm9yY2UgPSAxMDAwXHJcbiAgICBhaXJwYXNzaXZlU3RvcEZvcmNlID0gMzUwXHJcbiAgICBcclxuICAgIGp1bXBNYXhBbW1vID0gMVxyXG4gICAganVtcEFtbW8gPSB0aGlzLmp1bXBNYXhBbW1vXHJcbiAgICBjbGltYmZvcmNlID0gMjAwMFxyXG4gICAgd2FsbGhhbmdSZXNldHNKdW1wQW1tbyA9IHRydWVcclxuICAgIGZhbGxTdGFydCA9IDBcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgYm9keTpFbnRpdHkscHVibGljICB3b3JsZDpXb3JsZCl7XHJcbiAgICAgICAgd29ybGQuZW50aXRpZXMucHVzaChib2R5KVxyXG5cclxuICAgICAgICB3b3JsZC5iZWZvcmVVcGRhdGUubGlzdGVuKChkdCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgaW5wdXQgPSBnZXQyRE1vdmVJbnB1dFlmbGlwcGVkKClcclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmJvZHkudmVsLmFkZCh0aGlzLmdyYXZpdHkuYygpLnNjYWxlKGR0KSlcclxuICAgICAgICAgICAgaWYoa2V5c1sndyddICYmIHRoaXMuYm9keS5ncm91bmRlZC55ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qdW1wKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL21vdmVcclxuICAgICAgICAgICAgaWYoaW5wdXQueCAhPSAwKXtcclxuICAgICAgICAgICAgICAgIHZhciBhY2NGb3JjZSA9IHRoaXMuYm9keS5ncm91bmRlZC55ID09IDAgPyB0aGlzLmFpcmFjY2ZvcmNlIDogdGhpcy5hY2Nmb3JjZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ib2R5LnZlbC54ICs9IGlucHV0LnggKiBhY2NGb3JjZSAqIGR0XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmdpbmcgPSB0aGlzLmlzSGFuZ2luZygpXHJcbiAgICAgICAgICAgICAgICBpZihoYW5naW5nICE9IDAgJiYgdGhpcy5ib2R5LnZlbC55ID4gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwbHlTdG9wcGluZ0ZvcmNlKHRoaXMuYm9keS52ZWwsbmV3IFZlY3RvcigwLHRoaXMuY2xpbWJmb3JjZSAqIGR0KSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL3Bhc3NpdmUgc3RvcFxyXG4gICAgICAgICAgICBpZihpbnB1dC54ID09IDApe1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0b3BzdHJlbmd0aCA9IHRoaXMuYm9keS5ncm91bmRlZC55ID09IDAgPyB0aGlzLmFpcnBhc3NpdmVTdG9wRm9yY2UgOiB0aGlzLnBhc3NpdmVTdG9wRm9yY2VcclxuICAgICAgICAgICAgICAgIGFwcGx5U3RvcHBpbmdGb3JjZSh0aGlzLmJvZHkudmVsLG5ldyBWZWN0b3Ioc3RvcHN0cmVuZ3RoICogZHQsMCkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsKGUpID0+IHtcclxuICAgICAgICAgICAgaWYoZS5yZXBlYXQpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoZS5rZXkgPT0gJyAnIHx8IGUua2V5ID09ICd3Jyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmp1bXAoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgd29ybGQuYWZ0ZXJVcGRhdGUubGlzdGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaWYodGhpcy5ib2R5Lmdyb3VuZGVkLnkgPT0gMSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmp1bXBBbW1vID0gdGhpcy5qdW1wTWF4QW1tb1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRoaXMuYm9keS5ncm91bmRlZC54ICE9IDAgJiYgdGhpcy53YWxsaGFuZ1Jlc2V0c0p1bXBBbW1vKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuanVtcEFtbW8gPSB0aGlzLmp1bXBNYXhBbW1vXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIFxyXG5cclxuICAgIFxyXG4gICAganVtcCgpe1xyXG4gICAgICAgIHZhciBoYW5naW5nID0gdGhpcy5pc0hhbmdpbmcoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBqdW1wID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBpZihoYW5naW5nICE9IDAgJiYgdGhpcy5ib2R5Lmdyb3VuZGVkLnkgPT0gMCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJvZHkudmVsID0gbmV3IFZlY3RvcigtaGFuZ2luZywtMSkubm9ybWFsaXplKCkuc2NhbGUodGhpcy5qdW1wc3BlZWQpXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ib2R5LnZlbC55ID0gLXRoaXMuanVtcHNwZWVkXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGhhbmdpbmcgIT0gMCB8fCB0aGlzLmJvZHkuZ3JvdW5kZWQueSA9PSAxKXtcclxuICAgICAgICAgICAganVtcCgpXHJcbiAgICAgICAgfWVsc2UgaWYodGhpcy5qdW1wQW1tbyA+IDApe1xyXG4gICAgICAgICAgICBqdW1wKClcclxuICAgICAgICAgICAgdGhpcy5qdW1wQW1tby0tXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpc0hhbmdpbmcoKTpudW1iZXJ7XHJcbiAgICAgICAgdmFyIGhhbmdpbmcgPSAwXHJcbiAgICAgICAgaWYodGhpcy53b3JsZC5ib3hDYXN0KHRoaXMuYm9keS5ibG9jaywwLDAuMDEpLmhpdCl7XHJcbiAgICAgICAgICAgIGhhbmdpbmcgPSAxXHJcbiAgICAgICAgfWVsc2UgaWYodGhpcy53b3JsZC5ib3hDYXN0KHRoaXMuYm9keS5ibG9jaywwLC0wLjAxKS5oaXQpe1xyXG4gICAgICAgICAgICBoYW5naW5nID0gLTFcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGhhbmdpbmdcclxuICAgIH1cclxuICAgIFxyXG59IiwiaW1wb3J0IFZlY3RvciBmcm9tIFwiLi92ZWN0b3JcIjtcclxuXHJcbnZhciBsYXN0VXBkYXRlID0gRGF0ZS5ub3coKTtcclxudmFyIFRBVSA9IE1hdGguUEkgKiAyXHJcbmV4cG9ydCB7XHJcbiAgICBrZXlzLFxyXG4gICAgVEFVLFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9vcChjYWxsYmFjazooZHRzZWNvbmRzOm51bWJlcikgPT4gdm9pZCl7XHJcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKVxyXG4gICAgY2FsbGJhY2soKG5vdyAtIGxhc3RVcGRhdGUpIC8gMTAwMClcclxuICAgIGxhc3RVcGRhdGUgPSBub3dcclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICAgICAgbG9vcChjYWxsYmFjaylcclxuICAgIH0pXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kYmVzdEluZGV4PFQ+KGxpc3Q6VFtdLCBldmFsdWF0b3I6KHY6VCkgPT4gbnVtYmVyKTpudW1iZXIge1xyXG4gICAgaWYgKGxpc3QubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIH1cclxuICAgIHZhciBiZXN0SW5kZXggPSAwO1xyXG4gICAgdmFyIGJlc3RzY29yZSA9IGV2YWx1YXRvcihsaXN0WzBdKVxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHNjb3JlID0gZXZhbHVhdG9yKGxpc3RbaV0pXHJcbiAgICAgICAgaWYgKHNjb3JlID4gYmVzdHNjb3JlKSB7XHJcbiAgICAgICAgICAgIGJlc3RzY29yZSA9IHNjb3JlXHJcbiAgICAgICAgICAgIGJlc3RJbmRleCA9IGlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYmVzdEluZGV4XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kYmVzdDxUPihsaXN0OlRbXSwgZXZhbHVhdG9yOih2OlQpID0+IG51bWJlcik6VCB7XHJcbiAgICByZXR1cm4gbGlzdFtmaW5kYmVzdEluZGV4KGxpc3QsZXZhbHVhdG9yKV1cclxufVxyXG52YXIga2V5cyA9IHt9XHJcblxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGUgPT4ge1xyXG4gICAga2V5c1tlLmtleV0gPSB0cnVlXHJcbn0pXHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGUgPT4ge1xyXG4gICAga2V5c1tlLmtleV0gPSBmYWxzZSAgXHJcbn0pXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0MkRNb3ZlSW5wdXRZZmxpcHBlZCgpe1xyXG4gICAgdmFyIHJlcyA9IG5ldyBWZWN0b3IoMCwwKVxyXG4gICAgaWYoa2V5c1sndyddKXtcclxuICAgICAgICByZXMueS0tXHJcbiAgICB9XHJcbiAgICBpZihrZXlzWydzJ10pe1xyXG4gICAgICAgIHJlcy55KytcclxuICAgIH1cclxuICAgIGlmKGtleXNbJ2EnXSl7XHJcbiAgICAgICAgcmVzLngtLVxyXG4gICAgfVxyXG4gICAgaWYoa2V5c1snZCddKXtcclxuICAgICAgICByZXMueCsrXHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpblJhbmdlKG1pbixtYXgsdil7XHJcbiAgICByZXR1cm4gdiA+PSBtaW4gJiYgdiA8PSBtYXhcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1hcCh2YWw6bnVtYmVyLGZyb20xOm51bWJlcixmcm9tMjpudW1iZXIsdG8xOm51bWJlcix0bzI6bnVtYmVyKTpudW1iZXJ7XHJcbiAgICByZXR1cm4gbGVycCh0bzEsdG8yLGludmVyc2VMZXJwKHZhbCxmcm9tMSxmcm9tMikpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbnZlcnNlTGVycCh2YWw6bnVtYmVyLGE6bnVtYmVyLGI6bnVtYmVyKTpudW1iZXJ7XHJcbiAgICByZXR1cm4gdG8oYSx2YWwpIC8gdG8oYSxiKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG8oYTpudW1iZXIsYjpudW1iZXIpe1xyXG4gICAgcmV0dXJuIGIgLSBhXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsZXJwKGE6bnVtYmVyLGI6bnVtYmVyLHQ6bnVtYmVyKXtcclxuICAgIHJldHVybiBhICsgdG8oYSxiKSAqIHRcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN3YXAoYXJyLGEsYil7XHJcbiAgICB2YXIgdGVtcCA9IGFyclthXVxyXG4gICAgYXJyW2FdID0gYXJyW2JdXHJcbiAgICBhcnJbYl0gPSB0ZW1wXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWxsUmVjdChjdHh0OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxwb3M6VmVjdG9yLHNpemU6VmVjdG9yKXtcclxuICAgIGN0eHQuZmlsbFJlY3Qocm91bmQocG9zLngpLCByb3VuZChwb3MueSksIHNpemUueCwgc2l6ZS55KVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGluZShjdHh0OkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxvcmlnaW46VmVjdG9yLGRlc3RpbmF0aW9uOlZlY3Rvcil7XHJcbiAgICBjdHh0LmJlZ2luUGF0aCgpXHJcbiAgICB2YXIgZGlyID0gb3JpZ2luLnRvKGRlc3RpbmF0aW9uKS5ub3JtYWxpemUoKS5zY2FsZSgwLjUpXHJcbiAgICBjdHh0Lm1vdmVUbyhNYXRoLnJvdW5kKG9yaWdpbi54KSArIDAuNSAtIGRpci54LE1hdGgucm91bmQob3JpZ2luLnkpICsgMC41IC0gZGlyLnkpXHJcbiAgICBjdHh0LmxpbmVUbyhNYXRoLnJvdW5kKGRlc3RpbmF0aW9uLngpICsgMC41ICAtIGRpci54LE1hdGgucm91bmQoZGVzdGluYXRpb24ueSkgKyAwLjUgLSBkaXIueSlcclxuICAgIGN0eHQuc3Ryb2tlKClcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbjJEYXJyYXk8VD4oc2l6ZTpWZWN0b3IsY2I6KGk6VmVjdG9yKSA9PiBUKTpUW11bXXtcclxuICAgIHZhciByZXM6VFtdW10gPSBbXVxyXG4gICAgdmFyIGluZGV4ID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICBmb3IoaW5kZXgueSA9IDA7IGluZGV4LnkgPCBzaXplLnk7IGluZGV4LnkrKyl7XHJcbiAgICAgICAgdmFyIHJvdzpUW10gPSBbXVxyXG4gICAgICAgIHJlcy5wdXNoKHJvdylcclxuICAgICAgICBmb3IoaW5kZXgueCA9IDA7IGluZGV4LnggPCBzaXplLng7IGluZGV4LngrKyl7XHJcbiAgICAgICAgICAgIHJvdy5wdXNoKGNiKGluZGV4KSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDYW52YXMoeDogbnVtYmVyLCB5OiBudW1iZXIpe1xyXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICBjYW52YXMud2lkdGggPSB4O1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcylcclxuICAgIHZhciBjdHh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgIHJldHVybiB7Y3R4dDpjdHh0LGNhbnZhczpjYW52YXN9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2xhbXAodmFsLG1pbixtYXgpe1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KE1hdGgubWluKHZhbCxtYXgpLG1pbilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxlbmd0aGVuKHZhbCxhbW91bnQpe1xyXG4gICAgcmV0dXJuIHZhbCArIGFtb3VudCAqIE1hdGguc2lnbih2YWwpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmbG9vcih2YWwpe1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IodmFsKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2VpbCh2YWwpe1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbCh2YWwpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByb3VuZCh2YWwpe1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQodmFsKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tKCl7XHJcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWluKGEsYil7XHJcbiAgICByZXR1cm4gTWF0aC5taW4oYSxiKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF4KGEsYil7XHJcbiAgICByZXR1cm4gTWF0aC5tYXgoYSxiKVxyXG59XHJcblxyXG4iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3J7XHJcbiAgICB2YWxzOm51bWJlcltdID0gW11cclxuICAgIGNvbnN0cnVjdG9yKHgsIHksIHogPSAwKXtcclxuICAgICAgICB0aGlzLnZhbHNbMF0gPSB4XHJcbiAgICAgICAgdGhpcy52YWxzWzFdID0geVxyXG4gICAgICAgIHRoaXMudmFsc1syXSA9IHpcclxuICAgIH1cclxuXHJcbiAgICBhZGQodjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gdmFsICsgdi52YWxzW2ldKVxyXG4gICAgfVxyXG5cclxuICAgIHN1Yih2OlZlY3Rvcik6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiB2YWwgLSB2LnZhbHNbaV0pXHJcbiAgICB9XHJcblxyXG4gICAgbXVsKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IHZhbCAqIHYudmFsc1tpXSlcclxuICAgIH1cclxuXHJcbiAgICBkaXYodjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoKHZhbCxhcnIsaSkgPT4gdmFsIC8gdi52YWxzW2ldKVxyXG4gICAgfVxyXG5cclxuICAgIHNjYWxlKHY6bnVtYmVyKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IHZhbCAqIHYpXHJcbiAgICB9XHJcblxyXG4gICAgdG8odjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdi5jKCkuc3ViKHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgZmxvb3IoKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKCh2YWwsYXJyLGkpID0+IE1hdGguZmxvb3IodmFsKSlcclxuICAgIH1cclxuXHJcbiAgICBjZWlsKCk6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiBNYXRoLmNlaWwodmFsKSlcclxuICAgIH1cclxuXHJcbiAgICBsZXJwKHY6VmVjdG9yLHQ6bnVtYmVyKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYygpLmFkZCh0aGlzLnRvKHYpLnNjYWxlKHQpKVxyXG4gICAgfVxyXG5cclxuICAgIGxlbmd0aHNxKCk6bnVtYmVye1xyXG4gICAgICAgIHZhciBzdW0gPSAwO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLnZhbHMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBzdW0gKz0gdGhpcy52YWxzW2ldICogdGhpcy52YWxzW2ldXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdW1cclxuICAgIH1cclxuXHJcbiAgICBsZW5ndGgoKTpudW1iZXJ7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KHRoaXMubGVuZ3Roc3EoKSwwLjUpXHJcbiAgICB9XHJcblxyXG4gICAgbm9ybWFsaXplKCk6VmVjdG9ye1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlKDEgLyB0aGlzLmxlbmd0aCgpKVxyXG4gICAgfVxyXG5cclxuICAgIGMoKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IoMCwwKS5vdmVyd3JpdGUodGhpcylcclxuICAgIH1cclxuXHJcbiAgICBvdmVyd3JpdGUodjpWZWN0b3Ipe1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hcCgodmFsLGFycixpKSA9PiB2LnZhbHNbaV0pXHJcbiAgICB9XHJcblxyXG4gICAgZG90KHY6VmVjdG9yKTpudW1iZXJ7XHJcbiAgICAgICAgdmFyIHN1bSA9IDBcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy52YWxzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgc3VtICs9IHRoaXMudmFsc1tpXSAqIHYudmFsc1tpXVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3VtXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KGk6bnVtYmVyKXtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWxzW2ldXHJcbiAgICB9XHJcblxyXG4gICAgc2V0KGk6bnVtYmVyLHZhbDpudW1iZXIpe1xyXG4gICAgICAgIHRoaXMudmFsc1tpXSA9IHZhbFxyXG4gICAgfVxyXG5cclxuICAgIGNyb3NzKHY6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLnkgKiB2LnogLSB0aGlzLnogKiB2LnlcclxuICAgICAgICB2YXIgeSA9IHRoaXMueiAqIHYueCAtIHRoaXMueCAqIHYuelxyXG4gICAgICAgIHZhciB6ID0gdGhpcy54ICogdi55IC0gdGhpcy55ICogdi54XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IoeCx5LHopXHJcbiAgICB9XHJcblxyXG4gICAgcHJvamVjdE9udG8odjpWZWN0b3IpOlZlY3RvcntcclxuICAgICAgICByZXR1cm4gdi5jKCkuc2NhbGUodGhpcy5kb3QodikgLyB2LmRvdCh2KSkgIFxyXG4gICAgfVxyXG5cclxuICAgIGxvb3AyZChjYjooaTpWZWN0b3IpID0+IHZvaWQpe1xyXG4gICAgICAgIHZhciBjb3VudGVyID0gbmV3IFZlY3RvcigwLDApXHJcbiAgICAgICAgZm9yKGNvdW50ZXIueCA9IDA7IGNvdW50ZXIueCA8IHRoaXMueDsgY291bnRlci54Kyspe1xyXG4gICAgICAgICAgICBmb3IoY291bnRlci55ID0gMDsgY291bnRlci55IDwgdGhpcy55OyBjb3VudGVyLnkrKyl7XHJcbiAgICAgICAgICAgICAgICBjYihjb3VudGVyKVxyXG4gICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJvdGF0ZTJkKHJvdGF0aW9uczpudW1iZXIsb3JpZ2luOlZlY3RvciA9IG5ldyBWZWN0b3IoMCwwKSk6VmVjdG9ye1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpOlZlY3RvcntcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBtYXAoY2I6KHZhbCxhcnJheSxpKSA9PiBudW1iZXIpOlZlY3RvcntcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy52YWxzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgIHRoaXMudmFsc1tpXSA9IGNiKHRoaXMudmFsc1tpXSx0aGlzLnZhbHMsaSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHNbMF1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgeSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHNbMV1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgeigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHNbMl1cclxuICAgIH1cclxuXHJcbiAgICBzZXQgeCh2YWwpe1xyXG4gICAgICAgIHRoaXMudmFsc1swXSA9IHZhbFxyXG4gICAgfVxyXG5cclxuICAgIHNldCB5KHZhbCl7XHJcbiAgICAgICAgdGhpcy52YWxzWzFdID0gdmFsXHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHoodmFsKXtcclxuICAgICAgICB0aGlzLnZhbHNbMl0gPSB2YWxcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciB6ZXJvID0gbmV3IFZlY3RvcigwLDApOyIsImltcG9ydCBWZWN0b3IgZnJvbSAnLi92ZWN0b3InXHJcbmltcG9ydCB7IGludmVyc2VMZXJwLCBmaW5kYmVzdCwgaW5SYW5nZSwgdG8sIHN3YXAsIGZpbmRiZXN0SW5kZXgsIGxpbmUsIGdlbjJEYXJyYXksIGxlcnAsIGxlbmd0aGVuLCBjbGFtcCwgY2VpbCB9IGZyb20gJy4vdXRpbHMnXHJcbmltcG9ydCB7IEV2ZW50U3lzdGVtIH0gZnJvbSAnLi9ldmVudHN5c3RlbSdcclxuaW1wb3J0IHsgQmxvY2sgfSBmcm9tICcuL2Jsb2NrJ1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBFbnRpdHl7XHJcbiAgICBncm91bmRlZDpWZWN0b3IgPSBuZXcgVmVjdG9yKDAsMClcclxuICAgIHZlbDpWZWN0b3IgPSBuZXcgVmVjdG9yKDAsMClcclxuICAgIG1pbnNwZWVkOlZlY3RvciA9IG5ldyBWZWN0b3IoLTMwMCwtNjAwKVxyXG4gICAgbWF4c3BlZWQ6VmVjdG9yID0gbmV3IFZlY3RvcigzMDAsNjAwKVxyXG4gICAgZGlyOlZlY3RvciA9IG5ldyBWZWN0b3IoMSwwKVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBibG9jazpCbG9jayl7XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmF5Y2FzdEhpdHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwdWJsaWMgaGl0OmJvb2xlYW4sXHJcbiAgICAgICAgcHVibGljIG9yaWdpbjpWZWN0b3IsXHJcbiAgICAgICAgcHVibGljIGRpcjpWZWN0b3IsXHJcbiAgICAgICAgcHVibGljIGhpdExvY2F0aW9uOlZlY3RvcixcclxuICAgICAgICBwdWJsaWMgcmVsSGl0TG9jYXRpb246VmVjdG9yLFxyXG4gICAgICAgIHB1YmxpYyBub3JtYWw6VmVjdG9yLFxyXG4gICAgICAgIHB1YmxpYyBoaXRJbmRleDpWZWN0b3IsXHJcbiAgICApe1xyXG5cclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgV29ybGR7XHJcblxyXG4gICAgXHJcbiAgICBncmlkOm51bWJlcltdW10gPSBbXVxyXG4gICAgZW50aXRpZXM6RW50aXR5W10gPSBbXVxyXG4gICAgZmlyZWRSYXlzOlJheWNhc3RIaXRbXSA9IFtdXHJcbiAgICBiZWZvcmVVcGRhdGUgPSBuZXcgRXZlbnRTeXN0ZW08bnVtYmVyPigpXHJcbiAgICBhZnRlclVwZGF0ZSA9IG5ldyBFdmVudFN5c3RlbTxudW1iZXI+KClcclxuICAgIHNraW53aWR0aCA9IDAuMDFcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZ3JpZHNpemU6VmVjdG9yLCBwdWJsaWMgdGlsZXNpemU6bnVtYmVyKXtcclxuICAgICAgICB0aGlzLmdyaWQgPSBnZW4yRGFycmF5KGdyaWRzaXplLCgpID0+IDApXHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGR0c2Vjb25kczpudW1iZXIpe1xyXG4gICAgICAgIHRoaXMuYmVmb3JlVXBkYXRlLnRyaWdnZXIoZHRzZWNvbmRzKVxyXG4gICAgICAgIGZvcih2YXIgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpe1xyXG4gICAgICAgICAgICB2YXIgc3BlZWQgPSBlbnRpdHkudmVsLmMoKS5zY2FsZShkdHNlY29uZHMpXHJcbiAgICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9jbGFtcCBzcGVlZFxyXG4gICAgICAgICAgICBlbnRpdHkudmVsLm1hcCgodmFsLGFyciwgaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsYW1wKHZhbCxlbnRpdHkubWluc3BlZWQuZ2V0KGkpLGVudGl0eS5tYXhzcGVlZC5nZXQoaSkpXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vdmUoZW50aXR5LHNwZWVkKVxyXG4gICAgICAgICAgICBpZihzcGVlZC5sZW5ndGhzcSgpID4gMCl7XHJcbiAgICAgICAgICAgICAgICBlbnRpdHkuZGlyID0gc3BlZWQuYygpLm5vcm1hbGl6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hZnRlclVwZGF0ZS50cmlnZ2VyKGR0c2Vjb25kcylcclxuICAgIH1cclxuXHJcbiAgICBtb3ZlKGVudGl0eTpFbnRpdHksYW1vdW50OlZlY3Rvcil7XHJcbiAgICAgICAgdGhpcy5tb3ZlQXhpcyhlbnRpdHksMCxhbW91bnQueClcclxuICAgICAgICB0aGlzLm1vdmVBeGlzKGVudGl0eSwxLGFtb3VudC55KVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmVBeGlzKGVudGl0eTpFbnRpdHksYXhpczpudW1iZXIsYW1vdW50Om51bWJlcil7XHJcbiAgICAgICAgaWYoYW1vdW50ID09IDApe1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGhpdCA9IHRoaXMuYm94Q2FzdChlbnRpdHkuYmxvY2ssYXhpcyxhbW91bnQpXHJcbiAgICAgICAgZW50aXR5LmJsb2NrLm1vdmUoaGl0LnJlbEhpdExvY2F0aW9uKVxyXG4gICAgICAgIGVudGl0eS5ncm91bmRlZC52YWxzW2F4aXNdID0gKGhpdC5oaXQgPyAxIDogMCkgKiBNYXRoLnNpZ24oYW1vdW50KVxyXG4gICAgICAgIGlmKGhpdC5oaXQpe1xyXG4gICAgICAgICAgICBlbnRpdHkudmVsLnZhbHNbYXhpc10gPSAwXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGJveENhc3QoYmxvY2s6QmxvY2ssYXhpczpudW1iZXIsYW1vdW50Om51bWJlcixfc2tpbndpZHRoID0gdGhpcy5za2lud2lkdGgpe1xyXG4gICAgICAgIHZhciBkaXIgPSBWRnJvbUF4aXNBbW91bnQoYXhpcyxhbW91bnQpXHJcbiAgICAgICAgaWYoYW1vdW50ID09IDApe1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJheWNhc3RIaXQoZmFsc2UsYmxvY2suY2VudGVyKCksZGlyLG51bGwsbmV3IFZlY3RvcigwLDApLG51bGwsbnVsbClcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHNraW5ibG9jayA9IGJsb2NrLmMoKVxyXG4gICAgICAgIHNraW5ibG9jay5taW4uYWRkKG5ldyBWZWN0b3IoX3NraW53aWR0aCxfc2tpbndpZHRoKSlcclxuICAgICAgICBza2luYmxvY2subWF4LnN1YihuZXcgVmVjdG9yKF9za2lud2lkdGgsX3NraW53aWR0aCkpXHJcblxyXG4gICAgICAgIHZhciBwb2ludHMgPSB0aGlzLmdldFBvaW50c09uRWRnZShza2luYmxvY2ssZGlyKVxyXG4gICAgICAgIHZhciByYXlzID0gcG9pbnRzLm1hcChwb2ludCA9PiB0aGlzLnJheWNhc3RBeGlzQWxpZ25lZChwb2ludCxheGlzLGxlbmd0aGVuKGFtb3VudCxfc2tpbndpZHRoKSkpXHJcbiAgICAgICAgdmFyIGhpdHJheSA9IGZpbmRiZXN0KHJheXMuZmlsdGVyKHJheSA9PiByYXkuaGl0KSxyYXkgPT4gLXJheS5yZWxIaXRMb2NhdGlvbi5sZW5ndGgoKSlcclxuICAgICAgICBmb3IodmFyIHJheSBvZiByYXlzKXtcclxuICAgICAgICAgICAgcmF5LnJlbEhpdExvY2F0aW9uLnZhbHNbYXhpc10gPSBsZW5ndGhlbihyYXkucmVsSGl0TG9jYXRpb24udmFsc1theGlzXSwgLV9za2lud2lkdGgpXHJcbiAgICAgICAgICAgIHRoaXMuZmlyZWRSYXlzLnB1c2gocmF5KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaGl0cmF5ID8/IHJheXNbMF1cclxuICAgIH1cclxuXHJcbiAgICByYXljYXN0QXhpc0FsaWduZWQob3JpZ2luV29ybGQ6VmVjdG9yLGF4aXMsYW1vdW50KTpSYXljYXN0SGl0e1xyXG4gICAgICAgIHZhciBkaXJXb3JsZCA9IFZGcm9tQXhpc0Ftb3VudChheGlzLGFtb3VudClcclxuICAgICAgICB2YXIgZW5kID0gb3JpZ2luV29ybGQuYygpLmFkZChkaXJXb3JsZClcclxuICAgICAgICB2YXIgYm94ZXMyY2hlY2sgPSBjZWlsKE1hdGguYWJzKGFtb3VudCkgLyB0aGlzLnRpbGVzaXplKVxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPD0gYm94ZXMyY2hlY2s7IGkrKyl7XHJcbiAgICAgICAgICAgIHZhciBwb3MgPSBvcmlnaW5Xb3JsZC5sZXJwKGVuZCxpIC8gYm94ZXMyY2hlY2spXHJcbiAgICAgICAgICAgIGlmKHRoaXMuaXNCbG9ja2VkKHBvcykpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmF5Q2FzdChvcmlnaW5Xb3JsZCxkaXJXb3JsZCx0aGlzLmdldEJsb2NrKHBvcykpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSYXljYXN0SGl0KGZhbHNlLG9yaWdpbldvcmxkLGRpcldvcmxkLG9yaWdpbldvcmxkLmMoKS5hZGQoZGlyV29ybGQpLGRpcldvcmxkLmMoKSxkaXJXb3JsZC5jKCkubm9ybWFsaXplKCkuc2NhbGUoLTEpLG51bGwpXHJcbiAgICB9XHJcblxyXG4gICAgcmF5Q2FzdChvcmlnaW46VmVjdG9yLGRpcjpWZWN0b3IsYmxvY2s6QmxvY2spe1xyXG4gICAgICAgIHZhciBlbmQgPSBvcmlnaW4uYygpLmFkZChkaXIpXHJcbiAgICAgICAgdmFyIHJlczpSYXljYXN0SGl0ID0gbmV3IFJheWNhc3RIaXQoZmFsc2Usb3JpZ2luLGRpcixudWxsLG51bGwsbnVsbCxudWxsKVxyXG5cclxuICAgICAgICB2YXIgb3V0OltudW1iZXIsbnVtYmVyXSA9IFswLDBdXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVzLmhpdCA9IGNvbGxpZGVMaW5lKG9yaWdpbixvcmlnaW4uYygpLmFkZChkaXIpLGJsb2NrLG91dClcclxuICAgICAgICByZXMuaGl0TG9jYXRpb24gPSBvcmlnaW4ubGVycChlbmQsb3V0WzBdKVxyXG4gICAgICAgIHJlcy5yZWxIaXRMb2NhdGlvbiA9IG9yaWdpbi50byhyZXMuaGl0TG9jYXRpb24pXHJcbiAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgfVxyXG5cclxuICAgIGdldFBvaW50c09uRWRnZShib3g6QmxvY2ssZGlyOlZlY3Rvcil7XHJcblxyXG4gICAgICAgIHZhciByZXM6VmVjdG9yW10gPSBbXVxyXG4gICAgICAgIHZhciBjb3JuZXJzID0gW1xyXG4gICAgICAgICAgICBib3guZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMCwwKSksXHJcbiAgICAgICAgICAgIGJveC5nZXRDb3JuZXIobmV3IFZlY3RvcigxLDApKSxcclxuICAgICAgICAgICAgYm94LmdldENvcm5lcihuZXcgVmVjdG9yKDEsMSkpLFxyXG4gICAgICAgICAgICBib3guZ2V0Q29ybmVyKG5ldyBWZWN0b3IoMCwxKSksXHJcbiAgICAgICAgXVxyXG4gICAgICAgIGNvcm5lcnMgPSBjb3JuZXJzLmZpbHRlcihjb3JuZXIgPT4gYm94LmNlbnRlcigpLnRvKGNvcm5lcikubm9ybWFsaXplKCkuZG90KGRpci5jKCkubm9ybWFsaXplKCkpID4gMClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RhcnQgPSBjb3JuZXJzWzBdXHJcbiAgICAgICAgdmFyIGVuZCA9IGNvcm5lcnNbMV1cclxuICAgICAgICB2YXIgbm9mcG9pbnRzID0gY2VpbChzdGFydC50byhlbmQpLmxlbmd0aCgpIC8gdGhpcy50aWxlc2l6ZSkgKyAxXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG5vZnBvaW50cztpKyspe1xyXG4gICAgICAgICAgICByZXMucHVzaChzdGFydC5sZXJwKGVuZCwoaSAvIChub2Zwb2ludHMgLSAxKSkpKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBlbXB0eUZpcmVkUmF5cygpe1xyXG4gICAgICAgIHRoaXMuZmlyZWRSYXlzID0gW11cclxuICAgIH1cclxuXHJcbiAgICBpc0Jsb2NrZWQod29ybGQ6VmVjdG9yKXtcclxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLndvcmxkMmluZGV4KHdvcmxkKVxyXG4gICAgICAgIGlmKGluUmFuZ2UoMCx0aGlzLmdyaWRzaXplLnggLSAxLGluZGV4LngpICYmIGluUmFuZ2UoMCx0aGlzLmdyaWRzaXplLnkgLSAxLGluZGV4LnkpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZFtpbmRleC55XVtpbmRleC54XVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICBpc0Jsb2NrZWRJbmRleChpbmRleDpWZWN0b3Ipe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWRbaW5kZXgueV1baW5kZXgueF1cclxuICAgIH1cclxuXHJcbiAgICBnZXRCbG9jayh3b3JsZDpWZWN0b3Ipe1xyXG4gICAgICAgIHZhciB0b3BsZWZ0ID0gdGhpcy53b3JsZDJpbmRleCh3b3JsZCkuc2NhbGUodGhpcy50aWxlc2l6ZSlcclxuICAgICAgICByZXR1cm4gQmxvY2suZnJvbVNpemUodG9wbGVmdCxuZXcgVmVjdG9yKHRoaXMudGlsZXNpemUsdGhpcy50aWxlc2l6ZSkpXHJcbiAgICB9XHJcblxyXG4gICAgd29ybGQyaW5kZXgod29ybGQ6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIHdvcmxkLmMoKS5kaXYobmV3IFZlY3Rvcih0aGlzLnRpbGVzaXplLHRoaXMudGlsZXNpemUpKS5mbG9vcigpXHJcbiAgICB9XHJcblxyXG4gICAgaW5kZXgyd29ybGQoaW5kZXg6VmVjdG9yKTpWZWN0b3J7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4LmMoKS5zY2FsZSh0aGlzLnRpbGVzaXplKVxyXG4gICAgfVxyXG5cclxuICAgIGRlYnVnRHJhd0dyaWQoY3R4dDpDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpe1xyXG4gICAgICAgIGN0eHQuZmlsbFN0eWxlID0gJ2JsYWNrJ1xyXG4gICAgICAgIHRoaXMuZ3JpZHNpemUubG9vcDJkKGkgPT4ge1xyXG4gICAgICAgICAgICBpZih0aGlzLmlzQmxvY2tlZEluZGV4KGkpKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0QmxvY2sodGhpcy5pbmRleDJ3b3JsZChpKSkuZHJhdyhjdHh0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjdHh0LmZpbGxTdHlsZSA9ICdncmV5J1xyXG4gICAgICAgIGZvcih2YXIgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpe1xyXG4gICAgICAgICAgICBlbnRpdHkuYmxvY2suZHJhdyhjdHh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBkZWJ1Z0RyYXdSYXlzKGN0eHQ6Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKXtcclxuICAgICAgICBmb3IodmFyIHJheSBvZiB0aGlzLmZpcmVkUmF5cyl7XHJcbiAgICAgICAgICAgIGlmKHJheS5oaXQpe1xyXG4gICAgICAgICAgICAgICAgY3R4dC5zdHJva2VTdHlsZSA9ICdyZWQnXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgY3R4dC5zdHJva2VTdHlsZSA9ICdibHVlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgZGlyID0gcmF5LmRpci5jKCkubm9ybWFsaXplKClcclxuICAgICAgICAgICAgbGluZShjdHh0LHJheS5vcmlnaW4scmF5Lm9yaWdpbi5jKCkuYWRkKGRpci5zY2FsZSgxMCkpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gVkZyb21BeGlzQW1vdW50KGF4aXM6bnVtYmVyLGFtb3VudDpudW1iZXIpe1xyXG4gICAgdmFyIHYgPSBuZXcgVmVjdG9yKDAsMClcclxuICAgIHYudmFsc1theGlzXSA9IGFtb3VudFxyXG4gICAgcmV0dXJuIHZcclxufVxyXG5cclxuZnVuY3Rpb24gY29sbGlkZUxpbmUoYTpWZWN0b3IsYjpWZWN0b3IsYm94OkJsb2NrLG91dDpbbnVtYmVyLG51bWJlcl0pOmJvb2xlYW57XHJcbiAgICB2YXIgY2xpcDE6W251bWJlcixudW1iZXJdID0gWzAsMF1cclxuICAgIHZhciBjbGlwMjpbbnVtYmVyLG51bWJlcl0gPSBbMCwwXVxyXG5cclxuICAgIHJlbEludGVyc2VjdChhLngsYi54LCBib3gubWluLngsIGJveC5tYXgueCwgY2xpcDEpXHJcbiAgICByZWxJbnRlcnNlY3QoYS55LGIueSwgYm94Lm1pbi55LCBib3gubWF4LnksIGNsaXAyKVxyXG4gICAgXHJcbiAgICAvL3Jlc3VsdCBjb250YWlucyBpZiB0aGUgbGluZXMgaW50ZXJzZWN0ZWRcclxuICAgIHZhciByZXN1bHQgPSBpbnRlcnNlY3RMaW5lKGNsaXAxWzBdLGNsaXAxWzFdLGNsaXAyWzBdLGNsaXAyWzFdLG91dClcclxuICAgIHJldHVybiByZXN1bHQgJiYgaW5SYW5nZSgwLDEsb3V0WzBdKS8vICYmIGluUmFuZ2UoMCwxLG91dFsxXSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsSW50ZXJzZWN0KGFtaW46bnVtYmVyLGFtYXg6bnVtYmVyLGJtaW46bnVtYmVyLGJtYXg6bnVtYmVyLG91dDpbbnVtYmVyLG51bWJlcl0pe1xyXG4gICAgaWYoYW1pbiA9PSBhbWF4KXsvL3RoaXMgY291bGQgdXNlIHNvbWUgd29ya1xyXG4gICAgICAgIG91dFswXSA9IC1JbmZpbml0eVxyXG4gICAgICAgIG91dFsxXSA9IEluZmluaXR5XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5hYnModG8oYW1pbiwgYW1heCkpXHJcbiAgICBvdXRbMF0gPSBNYXRoLmFicyh0byhhbWluLGJtaW4pKSAvIGxlbmd0aDtcclxuICAgIG91dFsxXSA9IE1hdGguYWJzKHRvKGFtaW4sYm1heCkpIC8gbGVuZ3RoO1xyXG4gICAgaWYoYW1pbiA+IGFtYXgpe1xyXG4gICAgICAgIHN3YXAob3V0LDAsMSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaW50ZXJzZWN0TGluZShhbWluOm51bWJlcixhbWF4Om51bWJlcixibWluOm51bWJlcixibWF4Om51bWJlcixvdXQ6W251bWJlcixudW1iZXJdKXtcclxuICAgIHZhciBpYmVnaW4gPSBNYXRoLm1heChhbWluLGJtaW4pXHJcbiAgICB2YXIgaWVuZCA9IE1hdGgubWluKGFtYXgsYm1heClcclxuICAgIG91dFswXSA9IGliZWdpblxyXG4gICAgb3V0WzFdID0gaWVuZFxyXG4gICAgaWYoaWJlZ2luIDw9IGllbmQpe1xyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3RvcHBpbmdGb3JjZSh2ZWw6VmVjdG9yLGR0Zm9yY2U6VmVjdG9yKXtcclxuICAgIHZlbC54ID0gbW92ZVRvd2FyZHModmVsLngsMCxkdGZvcmNlLngpXHJcbiAgICB2ZWwueSA9IG1vdmVUb3dhcmRzKHZlbC55LDAsZHRmb3JjZS55KVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW92ZVRvd2FyZHMoY3VyOm51bWJlcixkZXN0aW5hdGlvbjpudW1iZXIsbWF4YW1vdW50Om51bWJlcil7XHJcbiAgICB2YXIgZGlyID0gdG8oY3VyLGRlc3RpbmF0aW9uKVxyXG4gICAgaWYoTWF0aC5hYnMoZGlyKSA8PSBtYXhhbW91bnQpe1xyXG4gICAgICAgIHJldHVybiBkZXN0aW5hdGlvblxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgcmV0dXJuIGN1ciArIE1hdGguc2lnbihkaXIpICogbWF4YW1vdW50XHJcbiAgICB9XHJcbn0iXX0=
