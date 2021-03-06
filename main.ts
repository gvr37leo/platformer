import {loop, createCanvas, clamp, keys, floor, round, line, strokeRect, getMousePos} from './utils'
import {World, Entity,relIntersect} from './world'
import { PlatformController } from './platformController'
import Vector from './vector'
import { Block } from './block'
import { TopDownController } from './topdownController'
import Camera from './camera'
import { IndexedDB } from './indexeddb'
import Level from './level'
import LevelEditor from './leveleditor'


// keys['d'] = true
var grid = [
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0],
    [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0],
    [0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0],
    [1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,1,1],
]
var gridsize = new Vector(grid[0].length,grid.length)
var world = new World(gridsize,40)
world.grid = grid
var platformController = new PlatformController(new Entity(Block.fromSize(new Vector(world.tilesize,world.tilesize).mul(new Vector(1,-2)), new Vector(40,40))),world)
// var topdownController = new TopDownController(new Entity(Block.fromSize(new Vector(world.tilesize,world.tilesize).mul(new Vector(12,12)), new Vector(40,40))),world)
var screensize = gridsize.c().scale(world.tilesize)//800 720
var {canvas,ctxt} = createCanvas(screensize.x,screensize.y)
// platformController.body.block.set(new Vector(40,40),new Vector(0,0))
// platformController.body.speed = new Vector(0,100)
var camera = new Camera(ctxt,platformController.body,screensize)
function start(){
    loop((dt) => {
        if(keys['p']){
            // keys['p'] = false
            // debugger
            camera.screenshake(1000,8,20)
        }
        
        ctxt.resetTransform()
        ctxt.clearRect(0,0,screensize.x,screensize.y)
        
        dt = clamp(dt,0.005,0.1)
        world.update(dt)//body gets moved
        camera.update()
        world.debugDrawGrid(ctxt)//body gets drawn
        // camera.debugdraw(ctxt)
        // world.debugDrawRays(ctxt)
        world.emptyFiredRays()
    })
}

var lvleditor = new LevelEditor(world,canvas,camera)
lvleditor.onLoad.listen(() => {
    start()
})

