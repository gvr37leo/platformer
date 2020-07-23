import { IndexedDB } from "./indexeddb"
import Level from "./level"
import { getMousePos, gen2Darray, query, index2d, index2dset } from "./utils"
import { World } from "./world"
import Vector, { zero } from "./vector"
import Camera from "./camera"
import { EventSystem } from "./eventsystem"
import { Block } from "./block"


export default class LevelEditor{

    loadedLevel:Level = null
    idb:IndexedDB
    onLoad = new EventSystem<any>()
    lastmouseevent: MouseEvent

    

    constructor(public world:World,canvas:HTMLCanvasElement, public camera:Camera){
        this.idb = new IndexedDB('plat',1,(db,self) => {
            var levelstore = db.createObjectStore("level", { keyPath: "id",autoIncrement:true })
            levelstore.add(new Level('default',1,[
                [0,1],
                [1,1],
            ]))
        
        },(db) => {
            this.updateDropdown()
            
            this.idb.filter<Level>('level',e => e.name == 'default').then(arr => {
                this.loadLevel(arr[0].id).then(() => {
                    this.onLoad.trigger(0)
                })
            })
            
        })

        canvas.addEventListener('mousedown', e => {
            this.lastmouseevent = e
        })

        canvas.addEventListener('contextmenu', e => {
            e.preventDefault()
        })

        world.beforeUpdate.listen(() => {
            if(this.lastmouseevent && (this.lastmouseevent.buttons & 1) > 0){
                var pos = getMousePos(this.lastmouseevent)
                var iv = world.world2index(this.camera.screenspace2worldspace(pos))
                if(Block.fromSize(new Vector(0,0),this.world.gridsize().sub(new Vector(1,1))).intersectVector(iv)){
                    this.world.grid[iv.y][iv.x] = this.lastmouseevent.shiftKey ? 0 : 1
                }
            }
        })
        canvas.addEventListener('mousemove', e => {
            this.lastmouseevent = e
        })

        document.querySelector('#createlevel').addEventListener('click', e => {
            var size = new Vector(getInputValueNumber('#sizex'),getInputValueNumber('#sizey'))
            this.createLevel(new Level(getInputValue('#name'),getInputValueNumber('#level'),gen2Darray(
                size
                ,i => {
                    if(i.y == size.y - 1){
                        return 1
                    }
                    return 0
                }))
            )
            .then(id => {
                this.updateDropdown()
                this.loadLevel(id)
            })
        })



        query('#levelselect').addEventListener('input', (e:any) => {
            this.loadLevel(parseInt(e.target.value))
        })

        query('#deletelevel').addEventListener('click', () => {
            this.deleteLevel(this.loadedLevel.id)
        })

        query('#savelevel').addEventListener('click', () => {
            this.loadedLevel.grid = this.world.grid
            this.loadedLevel.name = getInputValue('#name')
            this.loadedLevel.lvl = getInputValueNumber('#level')
            this.saveLevel(this.loadedLevel)
        })

        
    }

    createLevel(level:Level){
        return this.idb.add('level',level)
    }
    
    loadLevel(id:number){
        return this.idb.get('level',id).then((level:Level) => {
            setInputValue('#name',level.name)
            this.loadedLevel = level
            this.world.grid = level.grid
            this.world.entities[0].block.set(zero.c(),zero.c())
        })
    }
    
    saveLevel(level:Level){
        return this.idb.update('level',level).then(() => {

        })
    }

    deleteLevel(id){
        this.idb.remove('level',id)
    }

    updateDropdown(){
        document.querySelector('#levelselect').innerHTML = ''
        this.idb.filter<Level>('level',e => true).then((res) => {
            for(var level of res){
                document.querySelector('#levelselect').insertAdjacentHTML('beforeend',`<option value="${level.id}">${level.name}</option>`)
            }
        })
    }
    
}

function getInputValueNumber(selector:string){
    var element:HTMLInputElement = document.querySelector(selector)
    return element.valueAsNumber
}

function getInputValue(selector:string){
    var element:HTMLInputElement = document.querySelector(selector)
    return element.value
}

function setInputValue(selector,value){
    var element:HTMLInputElement = document.querySelector(selector)
    element.value = value
}




