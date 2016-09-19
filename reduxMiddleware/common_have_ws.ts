import * as CZ5 from "../common/cz5/index.ts"

import * as types from "../constants/index.ts"

import * as tool from "../common/walkingStick.ts"


export const GET = window["Symbol"]("GET");
export const POST = window["Symbol"]("POST");
export const WS_FETCH= window["Symbol"]("WS_FETCH");

import * as Command from "./constants.ts"

let CZ5Status=0;

var successKey,
    errorKey;

function objToRequestStr(obj){
    var str="?";
    for(var i in obj){
        str+=i+"="+obj[i]+"&";
    }
    str=str.substr(0,str.length-1);//remove last & symbol
    return str;
}

const fetch=window["fetch"];


const ajaxTools={
    [GET](request,dispatch){
        var requestStr=objToRequestStr(request.data);
        fetch(request.path+requestStr, {
            method: 'get',
            credentials: 'include'
        }).then(function(res) {
            return res.json();
        }).then(function (res){

            if(res.errMsg=="ok"){
                tool.fireFunction(request[successKey],[res]);
            }
            tool.fireFunction(request.onResponse,[null,res]);
            dispatch({type:request.successType,response:res});

        }).catch(function(err) {

            tool.fireFunction(request[errorKey],[err]);
            tool.fireFunction(request.onResponse,[err]);

            dispatch({type:request.errorType});
            //dispatch({type:request.successType,response:request.mockdata});
            //console.warn("****************     开发环境,接口异常后抛出 SUCCESS 状态,api 为准备好的前端MOCK 数据提供,API 打通后需要更改.************");

        });
    },

    [POST](request){

    }
    ,[WS_FETCH](request,dispatch){

        if(CZ5Status==1){
            return console.log("CZ5 connecting... please wait!");
        }else if(CZ5Status==0){
            return console.log("you need command INIT_WEBSOCKET first");
        }

        CZ5.fetch({
            method:request.method,
            timeout:15*1000,
            data:request.data,
            onResponse(res){

            },
        })

        .done((res)=>{
            tool.fireFunction(request.onResponse,[null,res,dispatch]);
            //dispatch({type:request.successType,response:res});
        })

        .error(function(msg){
            tool.fireFunction(request.onResponse,[msg,dispatch]);
            console.error("fetch error: " + msg);
        });
    }
}

const commands={
    [Command.INIT_WEBSOCKET](dispatch,action){
        if(CZ5Status==0){
            dispatch({type:types.WEBSOCKET_CONECTING});
            CZ5Status=1;
            CZ5.init({
                //host:"ws://11.239.185.27:9999",
                //host:"ws://30.30.148.32:9999",
                host:"ws://11.239.185.27:9999",
                onConnect(){
                    CZ5Status=2;
                    tool.fireFunction(action.onConnect,[dispatch]);
                    dispatch({type:types.WEBSOCKET_CONECTED});
                },
                onReconnect(){
                    tool.fireFunction(action.onReconnect,[dispatch]);
                    dispatch({type:types.WEBSOCKET_CONECTING});
                },
                onClose(){
                    CZ5Status=0;
                    tool.fireFunction(action.onClose,[dispatch]);
                    dispatch({type:types.WEBSOCKET_CLOSED});
                }
            });
        }
    }
}


function init(obj){

    successKey=obj&&obj.successKey?obj.successKey:"onSuccess";
    errorKey=obj&&obj.errorKey?obj.errorKey:"onError";

    return ({dispatch,getState})=>next=>action=>{

        if (typeof action === 'function') {
            return action(dispatch, getState);
        }else if(typeof action === "object"){

            if(action[GET]){
                ajaxTools[GET](action[GET],dispatch);
            }else if(action[POST]){
                ajaxTools[POST](action[POST],dispatch);
            }else if(action[WS_FETCH]){
                ajaxTools[WS_FETCH](action[WS_FETCH],dispatch);
            }else if(typeof(action["command"])=="string"){
                commands[action["command"]](dispatch,action);
            }else{
                return next(action);
            }

        }
    }

}


export const commonMiddleware=init;

