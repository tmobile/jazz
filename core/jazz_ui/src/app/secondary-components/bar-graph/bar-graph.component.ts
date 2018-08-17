import { Component, OnInit, Input, ElementRef, Inject } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";


@Component({
  selector: 'bar-graph',
  templateUrl: './bar-graph.component.html',
  styleUrls: ['./bar-graph.component.scss']
})
export class BarGraphComponent implements OnInit {

  @Input() graphData: any;
  // @Input() render: Function;

  root:any;
  private width: number;
  private height: number;
  private margin = {top: 0, right: 0, bottom: 0, left: 0};
  private x: any;
  private y: any;
  private xAxis:any;
  private svg: any;
  private g: any;
  
  public viewBox: string = '0 0 640 290';

  constructor(@Inject(ElementRef) elementRef: ElementRef) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = d3.select(el);
    this.width = 630 + this.margin.left + this.margin.right,
            this.height = 240 + this.margin.top + this.margin.bottom;
  }

  ngOnInit() {
    this.onGraphRender();
  }
  ngOnChanges(x:any){
    this.onGraphRender();
  }

  // public renderGraph(data){
  //   this.clearGraph(this.onGraphRender());
  // }

  // private clearGraph(onComplete) {
  //   this.root.select("svg").remove();
  //   if(typeof onComplete === "function"){
  //     onComplete()
  //   }
  // }

  private onGraphRender(){
    d3.selectAll("svg > *").remove();
      this.initSvg()
    this.initAxis();
    this.drawAxis();
  }

  private initSvg() {

    this.svg = this.root.select("svg")
    .attr("width", this.width - this.margin.left - this.margin.right)
    .attr("height", this.height - this.margin.top - this.margin.bottom)
    .append("g")
    .attr("transform", "translate(" + (this.margin.left+30) + "," + (-this.margin.top+10)+ ")");
  }

  private initAxis() {
    this.x = d3Scale.scaleBand()
            .domain(this.graphData.map((d) => d.date))
            .rangeRound([0, this.width - 50],0.5)
            .padding(0.1);


    this.y = d3Scale.scaleLinear()
            .domain([0, d3Array.max(this.graphData, (d) => d.cost)])
            .rangeRound([this.height, 0]);

  }

  private drawAxis() {
    this.xAxis=this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3Axis.axisBottom(this.x).tickSize(0));
      
      this.xAxis.selectAll("text")
      .attr("x",12)
      .attr("y",10)
      .attr("dx", 0)
      .attr("dy", 8)
      .style("text-anchor", "start");

       this.xAxis.append("text")
      .attr("class", "axis-title")
      .text("TIME")
      .attr("y",40)
      .attr("x",(this.width/2));

    this.svg.append("g")
      .attr("class", "y axis")
      .call(d3Axis.axisLeft(this.y).tickSize(-this.width).ticks(5,"$"))
      .append("text")
      .attr("class", "axis-title")
      .attr("transform", "rotate(-90)")
      .attr("y", -70)
      .attr("dy", "1.71em")
      .attr("text-anchor", "start")
      .text("COST")
      .attr("x",-(this.height/2));
             
    this.drawBars();

  }

 private toolTip() {

    var rectW = 71;
    var rectH = 56;

    var trnglW = 18;
    var trnglH = 12;

    var tooltip = this.svg.append("g")
      .attr("class", "tool-tip")
      .style("display", "none");
       
    tooltip.append("rect")
      .attr("class", "rect-outer")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("stroke","#333")
      .attr("fill","#fff")
      .attr("width", rectW)
      .attr("height", rectH);
    
    tooltip.append("text")
      .attr("y", 21)
      .attr("x", 8)
      .attr("class", "hover-x").text("4.00");
    
    tooltip.append("text")
      .attr("y", 45)
      .attr("x", 8)
      .attr("class", "hover-y").text("1");

    tooltip.append("path")
      .attr("fill","#333")
      .attr("d", "M 0 0 L " + (trnglW) + " 0 L " + (trnglW/2) + " " + trnglH + " Z")
      .attr("transform","translate(" + (rectW - trnglW)/2 + "," + (rectH) + ")");
     
    tooltip.append("path")
      .attr("fill","#fff")
      .attr("d", "M 0 0 L " + (trnglW) + " 0 L " + (trnglW/2) + " " + trnglH + " Z")
      .attr("transform","translate(" + (rectW - trnglW)/2 + "," + (rectH - 2) + ")");
  }

  private drawBars() {
    
    
    
    var sel = this.svg.selectAll(".bar")
      .data(this.graphData)
      .enter();
      
      sel.append("rect")
      .attr("class", "bar")
      .attr("x", (d) => this.x(d.date) +(this.x.bandwidth()/2))
      .attr("y", (d) => this.y(d.cost) )
      .attr("width", 50)
      .attr("height", (d) => this.height - this.y(d.cost))
      .on("mouseover", function() {
        sel.select(".tool-tip").style("display", "block"); 
      })
      .on("mouseout", function() { 
        sel.select(".tool-tip").style("display", "none")
      })
       .on("mousemove", function(d){
          var x0 = d3.select(this).attr("x")-10;
      var y0 = d3.select(this).attr("y")-self.svg.select(".rect-outer").attr("height")-10;
      
      var tooltip = self.svg.select(".tool-tip");
     tooltip.attr("transform", "translate(" + (x0) + "," +y0 + ")");

      tooltip.select('.hover-x').text(d.date);
      tooltip.select('.hover-y').text("$"+d.cost);
       });


     var self = this;
    this.toolTip();      
  }
}
