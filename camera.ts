import { Block } from "./block"
import Vector from "./vector"
import { Entity } from "./world"
import { Anim, AnimType, round, TAU, strokeRect } from "./utils"

export default class Camera{

    
    
    // offset:Vector
    // currentTarget:Vector
    deadZone:Block
    pos:Vector
    target:Vector

    screenshakeAnim = new Anim()
    wobbles:number = 0
    wobbleamount:number = 0
    constructor(public ctxt:CanvasRenderingContext2D,public focus:Entity,public screensize:Vector){
        this.pos = focus.block.center()
        // this.offset = this.screensize.c().scale(0.5).scale(-1)
        // var halfsize = this.screensize.c().scale(0.5)
        var slacksize = new Vector(60,30)
        // this.deadZone = new Block(halfsize.c().sub(slacksize), halfsize.c().add(slacksize))
        this.deadZone = new Block(slacksize.c().scale(-1),slacksize)
        this.screenshakeAnim.animType = AnimType.once
        this.screenshakeAnim.begin = 0
        this.screenshakeAnim.end = 1
    }

    

    update(){
        
        var target = this.focus.block.center()
        // target.add(this.focus.vel.c().sign().scale(50))
        // target.add(this.focus.vel.c().scale(0.2))
        this.target = target
        var pos2target = this.pos.to(target)
        var clampedp2t = this.deadZone.clamp(pos2target.c())
        this.pos.add(clampedp2t.to(pos2target))


        var screenshakeoffset = new Vector(0,0)
        screenshakeoffset.y = Math.sin(this.screenshakeAnim.get() * this.wobbles) * this.wobbleamount
        this.setCamera(this.pos.c().add(screenshakeoffset))

    }

    screenshake(duration:number,wobbles:number,wobbleamount:number){
        this.wobbles = wobbles
        this.wobbleamount = wobbleamount
        this.screenshakeAnim.stopwatch.start()
        this.screenshakeAnim.duration = duration
        this.screenshakeAnim.begin = 0
        this.screenshakeAnim.end = TAU
    }

    setCamera(pos:Vector){
        this.ctxt.resetTransform()
        pos.sub(this.screensize.c().scale(0.5))
        this.ctxt.translate(round(-pos.x),round(-pos.y))
    }

    debugdraw(ctxt:CanvasRenderingContext2D){
        ctxt.strokeStyle = 'black'
        strokeRect(ctxt,this.pos.c().add(this.deadZone.min),this.deadZone.size())
        ctxt.fillStyle = 'red'
        this.target.draw(ctxt)
    }
}