import { Component, OnInit, Input, ElementRef, Inject } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Format from "d3-time-format";
import * as d3Time from "d3-time";
import * as d3Axis from "d3-axis";
import { DataCacheService } from '../../core/services/index';

@Component({
  selector: 'line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss']
})

export class LineGraphComponent implements OnInit {

  @Input() graphData: any;
  @Input() graphDataOld: any;
  @Input() render: Function;
  @Input() timeRange:any;
  @Input() stat:any;

  root:any;

  private margin = {top: 0, right: 9, bottom: 36, left: 36};
  private axes = {top: 0, right: 0, bottom: 0, left: 0};
  private width: number;
  private height: number;
  private x: any;
  private y: any;
  private scale: any;
  private xAxis: any;
  private yAxis: any;
  private svg: any;
  cy:any;
  ypart:any;
  tooltip:any;
  valuesarray:any=[];
  sortedvalues:any=[];
  newData:any=[];
  private line: d3Shape.Line<[number, number]>;
  public viewBox: string ='0 0 640 290';

  constructor(
    private cache: DataCacheService,
    @Inject(ElementRef) elementRef: ElementRef
  ) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = d3.select(el);

    this.width = 630 - this.margin.left - this.margin.right ;
    this.height = 240 - this.margin.top - this.margin.bottom;
  }

  ngOnInit() {
    localStorage.setItem("stat",this.stat)
  }

  ngOnDestroy() {
    localStorage.removeItem('max');
    localStorage.removeItem('cy');
    localStorage.removeItem('range');
    localStorage.removeItem('cx');
    localStorage.removeItem('stat');
  }     
   

  ngOnChanges(x:any){
    if(this.graphData != undefined){
      this.onGraphRender()
      if (this.graphDataOld === undefined) {
        this.graphDataOld = this.graphData;
      }
    }    
  }
  public renderGraph(data){
    this.clearGraph(this.onGraphRender);
  }

  private clearGraph(onComplete) {
    this.root.select("svg").remove();
    if(typeof onComplete === "function"){
      onComplete()
    }
  }

  private onGraphRender() {
    d3.selectAll("svg > *").remove();
    this.initSvg();
    this.initAxis();
    this.drawAxis();
  }

  private initSvg() {
    this.svg = this.root.select("svg")
     .append("g")
     .attr("class", "base-group")
  }

  public initAxis() {

    

    var flagcodequality = this.cache.get("codequality");
    this.y = d3Scale.scaleLinear().range([this.height, 0]);
    for(var i=0 ; i<this.graphData.data.length; i++){
      this.valuesarray[i] = this.graphData.data[i].value;
      }
      this.sortedvalues = this.valuesarray.sort(function(a, b){return a - b});
      var max = this.sortedvalues[this.graphData.data.length - 1];
      var max4 = max/4;
      var max5 = max4*5;
      localStorage.setItem('max', JSON.stringify({ max: max }));
      if(max == 0){
        this.y.domain([0,0.1]);
      }else{
        this.y.domain([0,max5]);
      }

    
    // if(flagcodequality == true){

    // FOR CODEQUALITY
    // this.x = d3Scale.scaleTime().range([0, this.width]);
    // if( this.timeRange == 'Month'){
    //   this.x.domain([new Date().setDate(new Date().getDate()-180),new Date()]);
    // }else if( this.timeRange == 'Week'){
    //   this.x.domain([new Date().setDate(new Date().getDate()-30),new Date()]);
    // }else if( this.timeRange == 'Day'){
    //   this.x.domain([new Date().setDate(new Date().getDate()-7),new Date()]);
    // }
    if( this.graphData.data.length == 1){
      for(var i=0 ; i<this.graphData.data.length ; i++){
        this.graphData.data[i].date = new Date(this.graphData.data[i].date.valueOf() + this.graphData.data[i].date.getTimezoneOffset() * 60000);
        this.x = d3Scale.scaleTime().range([0, this.width]).domain(d3Array.extent(this.graphData.data, (d) => d.date ));

            var dayless = this.x.domain()[0].setDate(this.x.domain()[0].getDate()-1)
            var daymore = this.x.domain()[1].setDate(this.x.domain()[1].getDate()+1)
            this.x.domain([dayless, daymore]).nice()
      }
     }else{
      for(var i=0 ; i<this.graphData.data.length ; i++){
        this.graphData.data[i].date = new Date(this.graphData.data[i].date.valueOf() + this.graphData.data[i].date.getTimezoneOffset() * 60000);
      }
      this.x = d3Scale.scaleTime().range([0, this.width]);
      this.x.domain(d3Array.extent(this.graphData.data, (d) => d.date )).nice();
    }
    

    // FOR METRICS
  // }else if(flagcodequality == false){
       
  //      if( this.graphData.data.length == 1){
  //       for(var i=0 ; i<this.graphData.data.length ; i++){
  //         this.graphData.data[i].date = new Date(this.graphData.data[i].date.valueOf() + this.graphData.data[i].date.getTimezoneOffset() * 60000);
  //         this.x = d3Scale.scaleTime().range([0, this.width]).domain(d3Array.extent(this.graphData.data, (d) => d.date ));

  //             var dayless = this.x.domain()[0].setDate(this.x.domain()[0].getDate()-1)
  //             var daymore = this.x.domain()[1].setDate(this.x.domain()[1].getDate()+1)
  //             this.x.domain([dayless, daymore]).nice()
  //       } 
  //      }else{
  //       for(var i=0 ; i<this.graphData.data.length ; i++){
  //         this.graphData.data[i].date = new Date(this.graphData.data[i].date.valueOf() + this.graphData.data[i].date.getTimezoneOffset() * 60000);
  //       }
  //       this.x = d3Scale.scaleTime().range([0, this.width]);
  //       this.x.domain(d3Array.extent(this.graphData.data, (d) => d.date )).nice();
  //     }
      // }

  }
  public drawLine() {
    
    this.line = d3Shape.line()
      .x( (d: any) => this.x(d.date) )
      .y( (d: any) => this.y(parseFloat(d.value)) );

    if (this.graphDataOld == undefined) {
      this.graphDataOld = this.graphData;
    }
    var d0 = this.line(this.graphData.data);
   
      this.svg.append("path")
      .attr("class", "line line-plot")
      .attr("d", d0)
      this.svg.selectAll(".dot")
      .data(this.graphData.data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("d", d0)
      .attr("cx", (d) => this.x(d.date))
      .attr("cy", (d) => this.y(d.value))
      .on("mouseover", function() { 
        self.svg.select(".tool-tip").style("display", null);
        var cy = 204 - d3.select(this).attr("cy");
        var cx = d3.select(this).attr("cx");
        localStorage.setItem('cy', JSON.stringify({ cy: cy }));
        localStorage.setItem('cx', JSON.stringify({ cx: cx }));
      })
      .on("mouseout", function() { 
        self.svg.select(".tool-tip").style("display", "none");
      })
      .on("mousemove", mousemove)
      
    var bisectDate = d3Array.bisector(function(d) { return d.hour; }).left;

    var range =  this.graphData.xAxis.range;
    var self = this;

    var timeFormat = {
      '1 day' : '%b %d, %I:%M %p',
      'day' : '%b %d, %I:%M %p',
      '7 days' : '%b %d, %I:%M %p',
      'week':'%b %d, %I %p',
      '4 weeks' : '%b %d, %I %p',
      'month' : '%b %d %Y',
      '6 months' : '%b %d %y',
      '6months' : '%b %d %y',
      'year' : '%b %d %Y',
      '1 year' : '%b %y',
      '6 years' : '%Y'
    }
  
    function formatDate(date, range) {
;

      if (range == undefined) {
        range = 'day';
      }
      range = range.toLowerCase();
      
      var dateFormat = d3Format.timeFormat(timeFormat[range]);
      return dateFormat(date);
    }

    // function getGraphValue(key, data) {
    //   var pointer = key;
    //   // get y-axis value corresponding to x-axis date
    //   var entry = data[0];
    //   for (var i = 0; i <= data.length - 1; i++) {
    //       var record = data[i];
    //       var datapoint = record.date;
    //     if (datapoint >= pointer) {
    //       break;
    //     } else{
    //       entry = record;
    //     }
    //   }

    //   return entry;
    // }
    function mousemove() {
    
      var x0 = d3.mouse(this)[0];
      var y0 = d3.mouse(this)[1];

      var max = JSON.parse(localStorage.getItem('max'));
      var cy = JSON.parse(localStorage.getItem('cy'));
      var cx = JSON.parse(localStorage.getItem('cx'));
      var x1 = parseFloat(cx.cx);
      this.ypart = (max.max/163.2);
      var valueY = (cy.cy*this.ypart);
      // var value = getGraphValue(self.x.invert(x0+4), self.graphData.data);
      var date = self.x.invert(x1);
      var hoverX = formatDate(self.x.invert(x1), range)
      var stat = localStorage.getItem("stat");
      if( stat == 'Average' ){   
        var hoverY = valueY.toFixed(2);
      }else {
        var hoverY = valueY.toFixed(0)
      }     

      var tooltip = self.svg.select(".tool-tip");
      
      tooltip.attr("transform", "translate(" + (x0 - (75/2)) + "," + (y0 - 65) + ")");
      tooltip.select('.hover-x').text(hoverX);
      tooltip.select('.hover-y').text(hoverY);
    }

    this.toolTip()

  }

  private drawAxis() {

  	this.xAxis = d3Axis.axisBottom(this.x);
  	this.yAxis = d3Axis.axisLeft(this.y);

    this.svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis)

    this.svg.append("g")
      .attr("class", "axis axis--y")
      .call(this.yAxis);

    // Calculate width of the axis for accurate alignment
    this.axes.left = this.root.select('g.axis.axis--y').node().getBBox().width;
 
    var flagcodequality = this.cache.get("codequality");
   
    switch(this.timeRange){
      case 'Day': 
      
      if( flagcodequality ){ this.xAxis = d3Axis.axisBottom(this.x).tickSize(5).tickPadding(9).ticks(2).tickFormat(d3Format.timeFormat( '%b %d'));
        break;
      }else{
        localStorage.setItem("range","day");
          this.xAxis = d3Axis.axisBottom(this.x).tickSize(5).tickPadding(9).ticks(5).tickFormat(d3Format.timeFormat( '%b %d, %I %p'));
        break;
      }
      
      case 'Week':
      localStorage.setItem("range","week");
      this.xAxis = d3Axis.axisBottom(this.x).tickSize(5).tickPadding(9).ticks(5).tickFormat(d3Format.timeFormat('%b %d'));
                   break;

      case 'Month': 
      localStorage.setItem("range","month");
      this.xAxis = d3Axis.axisBottom(this.x).tickSize(5).tickPadding(9).ticks(5).tickFormat(d3Format.timeFormat('%b'));
                    break;

      case 'Year': 
      localStorage.setItem("range","year");
      this.xAxis = d3Axis.axisBottom(this.x).tickSize(5).tickPadding(9).ticks(5).tickFormat(d3Format.timeFormat('%b %Y'));
                    break;
    } 

    this.axes.bottom = this.root.select('g.axis.axis--x').node().getBBox().height;
    this.y = this.y.range([(this.height), 0]);
    this.yAxis = d3Axis.axisLeft(this.y).tickSize(-this.width).ticks(5);

    // redraw axes
    this.root.select('g.axis.axis--y').call(this.yAxis);

    this.svg.append("text")
      .attr("class", "axis-title axis-title--y")
      .attr("transform", "rotate(-90)")
      .attr("y", -(this.margin.left + this.axes.left/2))
      .attr("x", -(this.height/2)+ this.axes.bottom)
      .attr("dy", "0.21em")
      .style("text-anchor", "end")
      .style('font', '12px')
      .style('text-transform','uppercase')
      .text(this.graphData.yAxis.label);

    this.svg.append("text")
      .attr("class", "axis-title axis-title--x")
      .attr("y", this.height + this.margin.top + this.axes.bottom*2)
      .attr("x", this.width/2)
      .attr("dy", "1.71em")
      .style("text-anchor", "end")
      .style('font', '12px')
      .text(this.graphData.xAxis.label)
    .attr("transform", "translate(" + (this.axes.left / 2) + ",0)");
    this.root.select('g.axis.axis--x').call(this.xAxis).attr("transform", "translate(0," + this.height + ")");

    this.root.select('g.base-group').attr('transform', 'translate(' + (this.axes.left/ 2 + this.margin.left) + ',' + (this.axes.bottom / 2  + this.margin.top) + ')');
    this.drawLine();

  
  }

  private toolTip() {

    var rectW = 75;
    var rectH = 45;

    var trnglW = 15;
    var trnglH = 10;

    this.tooltip = this.svg.append("g")
      .attr("class", "tool-tip")
      .style("display", "none")
      .style("z-index", "100")
      .attr("transform", "translate(" + (rectW/2) + "," + (-rectH + 10) + ")");
      
      this.tooltip.append("rect")
      .attr("class", "rect-outer")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("z-index", "10000000")
      .attr("stroke","#999")
      .attr("fill","#fff")
      .attr("width", rectW)
      .attr("height", rectH);
    
      this.tooltip.append("text")
      .attr("y", 16)
      .attr("x", 6)
      .attr("fill","#999")
      .attr("width", rectW)
      .attr("class", "hover-x").text("4.00");
    
      this.tooltip.append("text")
      .attr("y", 35)
      .attr("x", 6)
      .attr("fill","#999")
      .attr("class", "hover-y").text("1");

      this.tooltip.append("path")
      .attr("fill","#999")
      .attr("d", "M 0 0 L " + (trnglW) + " 0 L " + (trnglW/2) + " " + trnglH + " Z")
      .attr("transform","translate(" + (rectW - trnglW)/2 + "," + (rectH) + ")");

      this.tooltip.append("path")
      .attr("fill","#fff")
      .attr("d", "M 0 0 L " + (trnglW) + " 0 L " + (trnglW/2) + " " + trnglH + " Z")
      .attr("transform","translate(" + (rectW - trnglW)/2 + "," + (rectH - 2) + ")");
  }
}