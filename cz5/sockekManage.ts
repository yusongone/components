const SocketHome=(()=>{
    let socket=null;
    const WebSocket = window['WebSocket'] || window['MozWebSocket'];
    const RECONNECT_INTERVAL=5000;

    let host = null;
    let reconnectInterval=null;
    let connecting=false;
    let connectOpenedHandlers=[];
    let disconnectHandlers=[];
    let deadHandlers=[];
    let reconnectHandlers=[];
    let messageHandlers=[];

    const PingPong=(()=>{
        const PING_INTERVAL=30000;
        let heartBeatTimeout;
        let pingInterval;
        let deadHandler=[];
        const setHeartBeat=reSetHeartBeat;


        function reSetHeartBeat(){
            heartBeatTimeout?clearTimeout(heartBeatTimeout):"";
            heartBeatTimeout=setTimeout(()=>{
                if(PingPong.ondied){
                    PingPong.ondied(new Date().getTime());
                }
            },PING_INTERVAL+1000);
        }

        return {
            startListenPang(){
                SocketHome.onMessage((event)=>{
                    if(typeof(event.data)=="object"){
                        var arrayBuffer;
                        var u8i;
                        var fileReader = new FileReader();
                        fileReader.onload = function() {
                            arrayBuffer = this.result;
                            u8i=new Uint8Array(arrayBuffer);
                            if(u8i[0]==0xA){
                                console.log("Pang");
                                reSetHeartBeat();
                            }
                        };
                        fileReader.readAsArrayBuffer(event.data);
                    }
                });
            },
            startPing(socket){
                var arrayBuffer=new ArrayBuffer(1);
                var u8i=new Uint8Array(arrayBuffer);
                u8i[0]=0x9;
                //u8i[0]=0b10001001;
                socket.send(u8i);

                pingInterval?clearInterval(pingInterval):"";
                pingInterval=setInterval(()=>{
                    if(socket.readyState==1){
                        console.log("send ping");
                        socket.send(u8i);
                    }
                },PING_INTERVAL);
                setHeartBeat();
            },
            stop(){
                pingInterval?clearInterval(pingInterval):"";
                heartBeatTimeout?clearTimeout(heartBeatTimeout):"";
            },
            ondied:null
        }
    })();


    function createSocket(){

        if(WebSocket){


            if(socket!=null){
                socket.onerror=null;
                socket.onclose=null;
                socket.onmessage=null;
            }

            PingPong.ondied=null;

            socket = new WebSocket(host);
            connecting=true;

            PingPong.ondied=function(){
                console.log("------------dead----------");
                for(var i=0;i<deadHandlers.length;i++){
                    deadHandlers[i](socket);
                };

                console.log("------------reConnecting...----------");
                for(var i=0;i<reconnectHandlers.length;i++){
                    reconnectHandlers[i](socket);
                };

                setTimeout(function(){ //reconnect after
                    createSocket();
                },RECONNECT_INTERVAL);

            }

            socket.onmessage = function(event) {
                for(var i=0;i<messageHandlers.length;i++){
                    messageHandlers[i](event);
                };
            };


            socket.onerror=function(msg){
                PingPong.stop();
            }


            socket.onopen = function(event) {
                console.log("------------open----------");
                connecting=false;

                if(reconnectInterval){
                    clearInterval(reconnectInterval);
                    reconnectInterval=null;
                }

                for(var i=0;i<connectOpenedHandlers.length;i++){
                    connectOpenedHandlers[i](socket);
                };
                PingPong.startPing(socket);
            };

            socket.onclose = function(event) {
                console.log("------------close----------");
                for(var i=0;i<disconnectHandlers.length;i++){
                    disconnectHandlers[i](socket);
                };

                console.log("------------reConnecting...----------");
                for(var i=0;i<reconnectHandlers.length;i++){
                    reconnectHandlers[i](socket);
                };
                setTimeout(function(){ //reconnect after
                    createSocket();
                },RECONNECT_INTERVAL);


                PingPong.stop();
            };

        }else{
            alert("你的浏览器不支持 WebSocket！");
        }
    };


    return{
        initSocket(option){
            host=option.host;
            createSocket();
            PingPong.startListenPang();
        },
        onOpen(handler){
            connectOpenedHandlers.push(handler);
        },
        onDisconnect(handler){
            disconnectHandlers.push(handler);
        },
        onDead(handler){
            deadHandlers.push(handler);
        },
        onReconnect(handler){
            reconnectHandlers.push(handler);
        },
        send(msg){
            if(socket.readyState==1){
                socket.send(msg);
            }
        },
        onMessage(handler){
            messageHandlers.push(handler);
        }
    }
})();

export default SocketHome;
