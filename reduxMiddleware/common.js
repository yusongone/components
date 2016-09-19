export const GET = Symbol("GET");
export const POST = Symbol("POST");

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
                if(request[successKey]&& typeof request[successKey]==="function"){
                    request[successKey](res,dispatch);
                }
            }

            if(request.onResponse && typeof(request.onResponse) ==="function"){
                request.onResponse(null,res,dispatch);
            }


        }).catch(function(err) {

            if(request[errorKey]&& typeof request[errorKey]==="function"){
                request[errorKey](err,dispatch);
            }

            //dispatch({type:request.successType,response:request.mockdata});
            //console.warn("****************     开发环境,接口异常后抛出 SUCCESS 状态,api 为准备好的前端MOCK 数据提供,API 打通后需要更改.************");

        });
    },

    [POST](request){

    }
}


function init(obj){

    successKey=obj&&obj.successKey?obj.successKey:"onSuccess";
    errorKey=obj&&obj.errorKey?obj.errorKey:"onError";

    return ({dispatch,getState})=>next=>action=>{


        if (typeof action === 'function') {

            return action(dispatch, getState);

        }else if(typeof action === "object"&&(action[GET]||action[POST])){


            action[GET]?ajaxTools[GET](action[GET],dispatch):'';
            action[POST]?ajaxTools[POST](action[POST],dispatch):'';

        }else{

            return next(action);

        }
    }
}



export const commonMiddleware=init;
