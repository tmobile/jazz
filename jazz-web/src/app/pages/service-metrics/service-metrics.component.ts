import { Component, OnInit, ElementRef, Inject } from '@angular/core';
import { DayData, WeekData, MonthData, Month6Data, YearData } from './data';
import { AfterViewInit, ViewChild } from '@angular/core';

// import { LineGraphComponent }  from './../../secondary-components/line-graph/line-graph.component';

@Component({
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit {

	// @ViewChild(LineGraphComponent)

	// public lineGraph: LineGraphComponent;

  filtersList: Array<string> = ['DAY', 'WEEK', 'MONTH', '6 MONTH', 'YEAR'];
  graphTypeList: Array<string> = ['Line'];
  environmentList: Array<string> = ['Environment'];
  viewBox = "0 0 300 150"

  graphsList = [
  	{
  		id: 'invocationError',
	  	title: 'Invocation Errors',
	  	data: DayData[0],
	  	dataOld: DayData[0]
	  }, {
	  	id: 'throttledInvocation',
	  	title: 'Throttled Invocations',
	  	data: DayData[1],
	  	dataOld: DayData[1]
	  }, {
	  	id: 'invocationCount',
	  	title: 'Invocation Count',
	  	data: DayData[2],
	  	dataOld: DayData[2]
	  }, {
	  	id: 'invocationError2',
	  	title: 'Invocation Errors',
	  	data: DayData[3],
	  	dataOld: DayData[3]
	  }, {
	  	id: 'throttledInvocation2',
	  	title: 'Throttled Invocation',
	  	data: DayData[4],
	  	dataOld: DayData[4]
	  }, {
	  	id: 'invocationCount2',
	  	title: 'Invocation Count',
	  	data: DayData[5],
	  	dataOld: DayData[5]
	  }
  ]
  root: any;

  // temporary graph data
  graphs: Array<any>;
  graphsOld: Array<any>;


  constructor(@Inject(ElementRef) elementRef: ElementRef) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = el;
    this.graphs = DayData;
    this.graphsOld = DayData;

    // for (var i = this.graphsList.length - 1; i >= 0; i--) {
    // 	var graph = this.graphsList[i];
    // 	graph.ref = this[graph.id];
    // }
  }

  ngOnInit() {
  }

  fetchGraphData(range: string){
  	// temporary graph data
  	var graphDataList = [DayData, WeekData, MonthData, Month6Data, YearData];
  	if (this.filtersList.indexOf(range) > -1) {
  		var graphsList = []

  		for (var i = this.graphsList.length - 1; i >= 0; i--) {
  			var graphObj = this.graphsList[i];
  			var graph = {
  				id: graphObj.id,
  				title: graphObj.title,
  				data: graphDataList[this.filtersList.indexOf(range)][i],
  				dataOld: graphObj.data
  			};

  			graphsList.push(graph);
  			
  			// graph.dataOld = graph.data;
  			// graph.data = graphDataList[this.filtersList.indexOf(range)][i];
  			// this.root.querySelector("#" + graph.id).render();
  			// this[graph.id].render();
  		}

  		this.graphsList = graphsList;
  	}
  }

  onTypeSelected(event){}
  onEnvSelected(event){}

  onFilterSelected(filters){
  	var filter = 'DAY';
  	if (filters[0]) {
  		filter = filters[0];
  	}
  	this.fetchGraphData(filter);
  }

}
