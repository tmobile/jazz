import { Component, OnInit, Input, ElementRef, Inject } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Format from "d3-time-format";
import * as d3Time from "d3-time";
import * as d3Axis from "d3-axis";

@Component({
  selector: 'line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss']
})

export class LineGraphComponent implements OnInit {

  @Input() graphData: any;
  @Input() graphDataOld: any;
  @Input() render: Function;

  root:any;

  private margin = {top: 0, right: 9, bottom: 36, left: 36};
  private axes = {top: 0, right: 0, bottom: 0, left: 0};
  private width: number;
  private height: number;
  private x: any;
  private y: any;
  private xAxis: any;
  private yAxis: any;
  private svg: any;
  private line: d3Shape.Line<[number, number]>;
  public viewBox: string = '0 0 360 216';

  constructor(@Inject(ElementRef) elementRef: ElementRef) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = d3.select(el);

    this.width = 360 - this.margin.left - this.margin.right ;
    this.height = 210 - this.margin.top - this.margin.bottom;
  }

  ngOnInit() {
    this.onGraphRender()
    if (this.graphDataOld === undefined) {
      this.graphDataOld = this.graphData;
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
    this.initSvg();
    this.initAxis();
    this.drawAxis();
  }

  private initSvg() {
    this.svg = this.root.select("svg")
     .append("g")
     .attr("class", "base-group")
     .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  private initAxis() {
    this.x = d3Scale.scaleTime().range([0, this.width]);
    this.y = d3Scale.scaleLinear().range([this.height, 0]);
    this.x.domain(d3Array.extent(this.graphData.data, (d) => d.date ));
    var yAxisRange = d3Array.extent(this.graphData.data, (d) => parseFloat(d.value));

    if(!yAxisRange[0] && !yAxisRange[1]){
      yAxisRange = [0 , 0]
    }
    this.y.domain(yAxisRange);
  }

  private drawAxis() {
  	this.xAxis = d3Axis.axisBottom(this.x).ticks(5);
  	this.yAxis = d3Axis.axisLeft(this.y).ticks(5);

    this.svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis)

    this.svg.append("g")
      .attr("class", "axis axis--y")
      .call(this.yAxis);
      

    // Calculate width of the axis for accurate alignment
    this.axes.left = this.root.select('g.axis.axis--y').node().getBBox().width;
    this.width = this.width - this.axes.left;
    this.x =this.x.range([0, (this.width)]);
    this.xAxis = d3Axis.axisBottom(this.x).tickSize(0).tickPadding(9).ticks(4);

    this.axes.bottom = this.root.select('g.axis.axis--x').node().getBBox().height;
    this.height = this.height - this.axes.bottom;
    this.y = this.y.range([(this.height), this.axes.bottom]);
    this.yAxis = d3Axis.axisLeft(this.y).tickSize(-this.width).ticks(3);

    // redraw axes
    this.root.select('g.axis.axis--y').call(this.yAxis);

    this.svg.append("text")
      .attr("class", "axis-title axis-title--y")
      .attr("transform", "rotate(-90)")
      .attr("y", -this.margin.left)
      .attr("x", -this.height/2)
      .attr("dy", "0.21em")
      .style("text-anchor", "end")
      .text(this.graphData.yAxis.label);

    this.svg.append("text")
      .attr("class", "axis-title axis-title--x")
      .attr("y", this.height + this.margin.top + this.axes.bottom)
      .attr("x", this.width/2)
      .attr("dy", "1.71em")
      .style("text-anchor", "end")
      .text(this.graphData.xAxis.label);
    this.root.select('g.axis.axis--x').call(this.xAxis).attr("transform", "translate(0," + this.height + ")");

    this.root.select('g.base-group').attr("transform", "translate(" + (this.axes.left/2 + this.margin.left) + "," + (this.axes.bottom/2  + this.margin.top) + ")");
    
    this.drawLine();
  }

  private toolTip() {

    var rectW = 71;
    var rectH = 56;

    var trnglW = 18;
    var trnglH = 12;

    var tooltip = this.svg.append("g")
      .attr("class", "tool-tip")
      .style("display", "none")
      .attr("transform", "translate(" + (rectW/2) + "," + (-rectH + 10) + ")");
      
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

  private drawLine() {
    
    this.line = d3Shape.line()
      .x( (d: any) => this.x(d.date) )
      .y( (d: any) => this.y(parseFloat(d.value)) );

    if (this.graphDataOld == undefined) {
      this.graphDataOld = this.graphData;
    }
    var d0;
    var d1 = this.line(this.graphDataOld.data);
    if(this.graphData.data.length > 0){
      d0 = this.line(this.graphData.data);

      this.svg.append("path")
      .attr("class", "line line-plot")
      .attr("d", d0)


      this.svg.append("path")
        .attr("class", "line line-plot-hover")
        .attr("d", d0)
        .attr("stroke-width","5")
        .on("mouseover", function() { 
          self.svg.select(".tool-tip").style("display", null); 
        })
        .on("mouseout", function() { 
          self.svg.select(".tool-tip").style("display", "none");
        })
        .on("mousemove", mousemove);
    } // end of if this.graphData.data


    

    var bisectDate = d3Array.bisector(function(d) { return d.hour; }).left;

    var range = this.graphData.xAxis.range;
    var self = this;

    var timeFormat = {
      '1 day' : '%I %p',
      'day' : '%I %p',
      '7 days' : '%a %d',
      '4 weeks' : '%b %d',
      '6 months' : '%b %d %y',
      '6months' : '%B %d',
      'year' : '%y',
      '1 year' : '%b %y',
      '6 years' : '%Y'
    }
    
    function formatDate(date, range) {
      if (range == undefined) {
        range = 'day';
      }
      range = range.toLowerCase();
      var dateFormat = d3Format.timeFormat(timeFormat[range]);
      return dateFormat(date);
    }

    function getGraphValue(key, data) {
      // get y-axis value corresponding to x-axis date
      var keyDt = new Date(key);
      var entry = data[0];
      for (var i = 0; i < data.length - 1; i++) {
        var record = data[i];

        var dt = new Date(record.date);
        if (dt > keyDt) {
          break
        } else{
          entry = record;
        }
      }
      return entry;
    }
    function mousemove() {
      var x0 = d3.mouse(this)[0];
      var y0 = d3.mouse(this)[1];
      var value = getGraphValue(self.x.invert(x0), self.graphData.data);

      var hoverX = formatDate(value.date, range);
      var hoverY = parseFloat(value.value).toFixed(2);

      var tooltip = self.svg.select(".tool-tip");

      tooltip.attr("transform", "translate(" + (x0 - 40) + "," + (y0 - 80) + ")");
      tooltip.select('.hover-x').text(hoverX);
      tooltip.select('.hover-y').text(hoverY);
    }
    this.toolTip()
  }
}