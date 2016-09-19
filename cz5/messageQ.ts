const messageQ=(()=>{
    let _Ary=[];
    let _socket;
    let pausing=true;
    let sending=false;

    function send(){
        sending=true;
        let message;
        if(_Ary.length>0&&!pausing){
            message=_Ary.shift();
            if(typeof(message)=="object"){
                message=JSON.stringify(_Ary.shift());
            }
            _socket.send(message);
            send();
        }else{
            sending=false;
        }
    }

    return {
        push(message:string|Number){
            _Ary.push(message);
            if(!sending&&!pausing){
                send();
            }
        },
        bindSocket(socket){
            _socket=socket;
            pausing=false;
            if(!sending){
                send();
            }
        },
        pause(socket){
            pausing=true;
        }
    }
})();

export default messageQ;
