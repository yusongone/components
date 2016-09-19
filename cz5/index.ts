import messageQ from "./messageQ.ts"
import SocketHome from "./sockekManage.ts"


interface cz5Option{
    host:string,
    onConnect?:Function,
    onClose?:Function,
    onReconnect?:Function
}

interface sockets{
    sendMsg:string|Number,
}



const Protocol=(()=>{

    //const ex={"headers": {"rid": "1000b530000f", "fin": 1}, "body": {}, "code": 200};
    const ex={"headers": {"rid": "1000b530000f", "fin": 1}, "code": 200};

    SocketHome.onMessage((event)=>{
        if(typeof(event.data)=="string"){
            try{
                const json=JSON.parse(event.data);
                const headers=json["headers"];
                if(typeof(headers)=="object"&&(!headers.noAck)&&json["mid"]){

                    //const mid="b1a085eb-e5b3-40b0-918a-60f8ce12bcfa";
                    const mid=json["mid"];
                    var arrayBuffer=new ArrayBuffer(1+mid.length);
                    var u8i=new Uint8Array(arrayBuffer);
                    u8i[0]=0x1;
                    for(var i=0;i<mid.length;i++){
                        u8i[i+1]=mid.charCodeAt(i);
                    }
                    SocketHome.send(u8i);
                }
            }catch(e){
                console.warn("ACK error");
            }
        }
    })

    return {
        filter(socketData){
            switch(typeof(socketData)){
                case "string"://text type
                    let json;
                    try{
                        json=JSON.parse(socketData);
                    }catch(e){
                        return false;
                    }
                    for(var i in ex){
                        if(json[i]==undefined){
                            console.error("response data lost :'"+i+"'");
                            return false;
                        }
                    }
                    if(json["headers"]&&(json["headers"].rid==undefined)){
                        console.error('response data lost :"rid" info');
                        return false;
                    }
                    return true;
                case "object":// maybe binary type
                    return null;
            }
            return true;
        },

        package(option){

            //const sendFormat={"method":"/sheet/getList", "headers": {"rid": "1000b530000f", "type": "PULL"}, "body": {"province": "gx"}};

            const temp={
                method:null,
                headers:{
                    "rid":null,
                    "type":"PULL",
                },
                body: {
                   args:{

                   }
                }
            };

            option.method!=undefined?(temp.method=option.method):console.error("lost method");
            option.id!=undefined?(temp.headers.rid=option.id):console.error("lost rid");

            if(option.data!=undefined&&typeof(option.data)=="object"){
                for(var i in option.data){
                    temp.body.args[i]=option.data[i];
                }
            }
            return temp;
        }

    }
})();







const FetchCreator=(()=>{
    const AllFetch={};


    interface fetchOption{
        method:string,
        id?:string,
        timeout?:number,
        onResponse?:Function,
        onError?:Function,
        data?:{
            rid?:string
        }
        queue?:boolean
    }

    SocketHome.onMessage((event)=>{
        if(typeof(event.data)=="string"){
            let tempData;
            try{
                tempData=JSON.parse(event.data);
            }catch(e){
                console.error("response a error message ",e);
                return;
            }
            if(Protocol.filter(event.data)){
                const headers=tempData["headers"];
                const rid=headers["rid"];
                if(AllFetch[rid]!=undefined){
                    var myFetch=AllFetch[rid]

                    if(headers["error"]) {
                        const errorHandlers = myFetch._doneHandlers;
                        for (let i = 0; i < errorHandlers.length; i++) {
                            errorHandlers[i](tempData.error);
                        };
                    }else{
                        if(AllFetch[rid]._msg!=undefined){
                            myFetch._msg(tempData.body);

                        }

                        const doneHandlers=myFetch._doneHandlers;
                        for(var i=0;i<doneHandlers.length;i++){
                            doneHandlers[i](tempData.body);
                        }
                    }

                    delete AllFetch[rid]
                }
            }else{
                console.error("websocket bad response");
            }
        }
    });

    class MyFetch{
        _id=null;
        _msg=null;
        _requestTime=new Date().getTime();
        _timeout=60*1000;
        _doneHandlers=[];
        _onError=null;
        _errorHandlers=[];

        constructor(option:fetchOption){
            this._id=option.id;
            this._msg=option.onResponse;
            if(option.onError&&typeof(option.onError)=="function"){
                this._onError=option.onError;
            }

            const sendOption=Protocol.package(option);
            const msg=JSON.stringify(sendOption)

            if(option.queue==false){
                SocketHome.send(msg);
            }else{
                messageQ.push(msg);
            }

            if(option.timeout!=undefined&&typeof(option.timeout)=="number"){
                if(option.timeout>300*1000||option.timeout<5*1000){
                    console.warn("Timeout settings must between 5 seconds to 300 seconds!")
                }else{
                    this._timeout=option.timeout;
                }
            }
        }

        isTimeout(nowTime){
            if(nowTime-this._requestTime>this._timeout){
                const errorMsg="time out"
                this._onError?this._onError(errorMsg):"";
                for(let i=0;i<this._errorHandlers.length;i++){
                    this._errorHandlers[i](errorMsg);
                };
                return true;
            }
            return false;
        }
        done(handler){
            this._doneHandlers.push(handler);
            return this;
        }
        error(handler){
            this._errorHandlers.push(handler);
            return this;
        }
    }

    /*
      if AllFetch empty , release loop;
    * */
    let timeoutLoopInterval;
    function createCheckTimeoutLoop(){

        if(timeoutLoopInterval){
            clearInterval(timeoutLoopInterval);
        }

        timeoutLoopInterval=setInterval(()=>{
            let time=new Date().getTime();
            for(var i in AllFetch){
                if(AllFetch[i].isTimeout(time)){
                    delete AllFetch[i];
                }
            }
        },1000);
    }

    return {
        getFetch(option:fetchOption){
            if(option.id){
                if(AllFetch[option.id]){
                    console.error("您必须对fetch创建唯一ID,或者在fetch回调函数后再次发起fetch");
                    return null;
                }else{
                    option.id=option.id;
                }
            }else{
                const rd = Math.floor(Math.random()*100);
                option.id=new Date().getTime()+"0"+rd;
            }

            let fc=new MyFetch(option);
            AllFetch[option.id]=fc;
            createCheckTimeoutLoop();
            return fc;
        }
    }
})();

let _init=(option:cz5Option)=>{
    SocketHome.initSocket({
        host:option.host,
    });

    SocketHome.onOpen((socket)=>{
        messageQ.bindSocket(socket);
        option.onConnect?option.onConnect():"";
    });

    SocketHome.onReconnect(()=>{
        option.onReconnect?option.onReconnect():"";
    })

    SocketHome.onDisconnect((socket)=>{
        option.onClose?option.onClose():"";
        messageQ.pause(socket);
    });

    _init=()=>{console.log("CZ5 ware initialized");}
}

export const init=(option:cz5Option)=>{
    _init(option);
}



export const onReconnect=SocketHome.onReconnect;
export const send=SocketHome.send;
export const onMessage=SocketHome.onMessage;
export const onConnect=SocketHome.onOpen;
export const onDisconnect=SocketHome.onDisconnect;
export const onDead=SocketHome.onDead;
export const fetch=FetchCreator.getFetch;

export function queueUp(msg){
    messageQ.push(msg);
}

