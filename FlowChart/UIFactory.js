import Line from "./line"
import Rect from "./rect"
import {select} from "d3-selection"
import  "d3-transition"

export default class UIFactory{
    fromTags=[];
    targetTags=[];
    svg=null;
    parentDOM=null;
    _lineType;
    lineList=[];

    constructor(option,svg,parentDOM,lineType){
        this.svg=option.svg;
        this.parentDOM=option.parentDOM;
        this._lineType=option.lineType;
        this.props=option.props;
    }

    setLineType(lineType){
        this._lineType=lineType;
    };

    getTags(id,type){
        if(type&&type=="from"){
            for(var i=0;i<this.fromTags.length;i++){
                if(this.fromTags[i].id==id){
                    return this.fromTags[i];
                }
            }
        }else if(type&&type=="target"){
            for(var i=0;i<this.targetTags.length;i++){
                if(this.targetTags[i].id==id){
                    return this.targetTags[i];
                }
            }
        }
    };

    createFrom(fromData){
        for(var i=0;i<fromData.length;i++){
            const temp=fromData[i];
            this.add(temp,"from");
        }
    };

    createTo(toData){
        for(var i=0;i<toData.length;i++){
            const temp=toData[i];
            this.add(temp,"target");
        }
    };

    cleanAll(){
        this.removeAllLine()
        for(var i=0;i<this.fromTags.length;i++){
            this.fromTags[i].destroy()
        }
        this.fromTags.length=0;
        for(var i=0;i<this.targetTags.length;i++){
            this.targetTags[i].destroy()
        }
        this.targetTags.length=0;
    };

    removeAllLine(){
        for(var i=0;i<this.lineList.length;i++){
            const temp=this.lineList[i];
            temp.destroy();
        }
        this.lineList.length=0;
    };


    drawLine(data){
        const fromTag=this.getTags(data.from.crowdId,"from");
        const targetTag=this.getTags(data.to.crowdId,"target");
        const line=new Line(this.svg,fromTag,targetTag,this._lineType,this.parentDOM);
        this.lineList.push(line);
        line.rePosition();

    }

    add(data,type){
        const _self=this;
        if(type=="from"){
            const rect=new Rect({
                svg:this.svg,
                option:data,
                type:"from"
            });
            rect.onClick((data)=>{
                _self.props.onClick(data);

                _self.removeAllLine();
                _self.fromTags.forEach((item)=>{
                    item.active(false);
                });

                rect.active(true);
            });

            this.fromTags.push(rect);

        }else if(type=="target"){
            const rect=new Rect({
                svg:this.svg,
                option:data,
                type:"target",
                hover:false
            });
            this.targetTags.push(rect);
        }
        this.rePosition();
    }

    rePosition(){
        let length=this.fromTags.length;
        const width=Math.max(this.parentDOM.clientWidth,500);
        const height=Math.max(this.parentDOM.clientHeight,300);

        let step=width/length;
        for(var i=0;i<length;i++){
            const rect=this.fromTags[i];
            rect.setPosition((step)/2-60+i*(step),11);
        };

        length=this.targetTags.length;
        step=width/length;
        for(var i=0;i<length;i++){
            const rect=this.targetTags[i];
            rect.setPosition((step)/2-60+i*(step),height-70);
        }

        for(var i=0;i<this.lineList.length;i++){
            this.lineList[i].rePosition(false);
        }
    }

}

