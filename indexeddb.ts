export class IndexedDB{
    
    db:IDBDatabase

    constructor(public name:string,version:number,schemacb:(db:IDBDatabase,self:IndexedDB) => void,cb:(db:IndexedDB) => void){

        var request = window.indexedDB.open('test',version)
        request.addEventListener('error', (e:any) => {
            console.error("Database error: " + e.target.errorCode);
        })

        request.addEventListener('success', (e:any) => {
            this.db = e.target.result
            cb(this)
            // var levelstore = db.transaction("level","readwrite").objectStore('level')
            // read(db,'level',1,(event:any) => {
            //     console.log(event.target.result);
            // })
        })



        request.addEventListener('upgradeneeded', (e:any) => {
            this.db = e.target.result
            schemacb(e.target.result,this)
        })
    }

    read(table:string,id:any,cb){
        return new Promise((res,rej) => {
            this.db.transaction(table,'readonly').objectStore(table).get(id).onsuccess = function(e:any) {
                res(e.target.result)
            };
        })
    }
    
    add(table:string,object:any){
        return new Promise((res,rej) => {
            this.db.transaction(table,'readwrite').objectStore(table).add(object).addEventListener('success', (e:any) => {
                res(e.target.result)
            })
        })
    }
    
    update(table:string,object:any,cb){
        return new Promise((res,rej) => {
            var req = this.db.transaction(table,'readwrite').objectStore(table).put(object)
            req.addEventListener('success', (e:any) => {
                res(e.target.result)
            })
        })
    }
    
    remove(table:string,key:any,cb){
        return new Promise((res,rej) => {
            var req = this.db.transaction(table,'readwrite').objectStore(table).delete(key)
            req.addEventListener('success', (e:any) => {
                res(e.target.result)
            })
        })
    }
    
    filter(table:string,filter:(entry:any) => boolean,cb){
        return new Promise((reb,rej) => {
            var res = []
            var req = this.db.transaction(table,'readwrite').objectStore(table).openCursor()
            req.addEventListener('success', (e:any) => {
                var cursor:IDBCursorWithValue = e.target.result
                if(cursor){
                    if(filter(cursor.value)){
                        res.push(cursor.value)
                    }
                    cursor.continue()
                }else{
                    reb(res)
                }
            })
        })
    }
}