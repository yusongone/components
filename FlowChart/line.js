import {line} from "d3-shape"

const D3={line:line}

export default class Line{
    lineMath=null;
    fromTag=null;
    targetTag=null;
    parentDOM=null;
    constructor(svg,fromTag,targetTag,type,parentDOM){
        this.fromTag=fromTag;
        this.targetTag=targetTag;
        this.parentDOM=parentDOM;

        const lineMath=D3.line();


        lineMath.x(function(item){
            return item.x;
        });
        lineMath.y(function(item){
            return item.y;
        });


        if(type=="A"){
            this.lineMath=function(d){
                return "M" + d[0].x + "," + d[0].y
                    + "C" +d[1].x+ "," + d[1].y
                    + " " +d[2].x+ "," +  d[2].y
                    + " " +d[3].x+ "," +  d[3].y;
            };
        }else{
            this.lineMath=lineMath;
        }

        const path=svg.append("path");
        path.attr("stroke","rgba(95,135,205,0.7)")
            .attr("stroke-width","4")
            .attr("fill","none")
            .attr("cursor","pointer")

        const text=svg.append("text");
        text.text(this.targetTag.option.cnt)
            .attr("alignment-baseline","middle")
            .attr("text-anchor","left")
            .attr("fill","#555")

        this.text=text;
        this.body=path;
    }

    destroy(){
        this.body.remove();
        this.text.remove();
    }

    rePosition(animation){

        const from={x:this.fromTag.position[0]+60,y:this.fromTag.position[1]+60};
        const mid={x:30,y:this.parentDOM.clientHeight*0.4};
        const to={x:this.targetTag.position[0]+60,y:this.targetTag.position[1]-10};

        const Ary=[];
        Ary.push(from);
        Ary.push({x:from.x,y:mid.y});
        Ary.push({x:to.x,y:mid.y});
        Ary.push({x:to.x,y:to.y});

        this.body.datum(Ary);
        this.body.attr("d",this.lineMath);

        const length=this.body.node().getTotalLength();
        this.body.attr("stroke-dasharray",length);
        this.body.attr("stroke-dashoffset",length);
        this.text.attr("x",this.targetTag.position[0]+70)
            .attr("y",this.targetTag.position[1]-20);
        const text=this.text;
        if(animation!=false){
            this.text.style("display","none")
            this.body.transition().duration(1000).attr("stroke-dashoffset",0).on("end",()=>{
                text.style("display","block")
            });
        }else{
            this.body.attr("stroke-dashoffset",0);
        }
    }

}

