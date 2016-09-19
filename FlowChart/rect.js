export default class Rect{
    body=null;
    clickHandlers=[];
    option=null;
    position=[];
    id=null;
    _active=false;
    constructor(jsonObj){
        const _self=this;
        this.body=jsonObj.svg.append("g");
        this.body.attr("class","tag "+jsonObj.type);
        this.option=jsonObj.option;
        this.id=jsonObj.option.id;

        const rect=this.body.append("rect");
        rect.attr("width",120)
            .attr("height",60)
            .attr("class","rect")
            .attr("stroke","rgba(95,135,205,0.3)")
            .attr("stroke-width","2")
            .attr("fill","#fff");
            /*
            .attr("rx",15)
            .attr("ry",15);
            */

        const text=this.body.append("text");
        text.text(jsonObj.option.name)
            .attr("alignment-baseline","left")
            .attr("text-anchor","left")
            .attr("class","str")
            .attr("fill","#666")
            .attr("x",10)
            .attr("y",20);

        const text2=this.body.append("text");
        text2.text(jsonObj.option.value)
            .attr("alignment-baseline","left")
            .attr("text-anchor","left")
            .attr("class","num")
            .attr("fill","rgba(95,135,205,1)")
            .attr("x",10)
            .attr("y",42);

        if(jsonObj.type=="target"){
            rect.attr("stroke","#ddd")
                .attr("fill","#efefef")
                .attr("stroke-width","2")
        }

        if(jsonObj.hover!=false){
            this.body.on("mouseover",()=>{
                rect.attr("fill","rgba(95,135,205,0.5)")
                text.attr("fill","#fff")
                text2.attr("fill","#fff")
            });

            this.body.on("mouseout",()=>{
                _self._updateUI();
            });
        }

        this.rect=rect;
        this.text=text;
        this.text2=text2;


        this.body.on("click",()=>{
            for(var i=0;i<_self.clickHandlers.length;i++){
                _self.clickHandlers[i](jsonObj.option);
            }
        });
    }
    _updateUI(){
        if(this._active){
            this.rect.attr("fill","rgba(95,135,205,1)")
            this.text.attr("fill","#fff")
            this.text2.attr("fill","#fff")
        }else{
            this.rect.attr("fill","#fff")

            this.text.attr("fill","#666")
            this.text2.attr("fill","rgba(95,135,205,1)")
        }
    }
    destroy(){
        this.body.remove();
    }
    setPosition(x,y){
        this.position=[x,y];
        this.body.style("transform","translate("+x+"px,"+y+"px)")
    }
    active(status){
        this._active=status;
        this._updateUI();
    }
    onClick(handler){
        this.clickHandlers.push(handler);
    }
}

