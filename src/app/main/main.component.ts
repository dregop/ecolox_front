import { AfterContentInit, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Line } from '../models/line';
import { LineDataApiService } from '../services/line-data-api.service';
import { GraphService } from './graph.service';
import { ToastService, toastType } from '../toast.service';

export  class Co2ByOriginByTime {
  co2!: number;
  date!: any;
  origin?: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, AfterContentInit {
  @ViewChild('chart') chartElement!: ElementRef;

  parseDate = d3.timeParse('%d-%m-%Y');

  public dataExtensionCo2TimeSerie: Co2ByOriginByTime[] = [];
  public firstDataExtensionCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataDrawnCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataSumDbExtensionCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataDbCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataDbCo2TimeSerieFiltered: Co2ByOriginByTime[] = [];
  private dataGlobalMeanCo2TimeSerie: Co2ByOriginByTime[] = [];
  private chartProps: any;
  private glines: any;
  private valueslines: Line[] = [];
  private zoom!: any;
  private onZoom = false;
  private selectedColor!: string;
  private listColors = ['green', 'orange', 'red', 'yellow'];
  private marginYDomain = 50;
  private tooltip!: any;
  private tooltipCircle!: any;
  private xz: any;
  private yz: any;
  private GESgCO2ForOneKmByCar = 220;
  private GESgCO2ForOneChargedSmartphone = 8.3;
  private isDataSaved = false;
  public isExtensionMessageDisplayed = false;
  public browserName: string = "Chrome";

  @Output() displayMessageExtension = new EventEmitter<boolean>();

  constructor(private lineDataApi: LineDataApiService, private graphService: GraphService, public toastService: ToastService) {
  }
  ngAfterContentInit(): void {
    setTimeout(() => { //FIXME: de la belle merde
      if (this.isDataSaved) {
        this.displayMessageExtension.emit(false);
        this.isExtensionMessageDisplayed = false;
      } else {
        this.displayMessageExtension.emit(true);
        const display = localStorage.getItem('install_extension_message_display');
        if (display && display === 'false') {
          this.isExtensionMessageDisplayed = false;
        } else {
          this.isExtensionMessageDisplayed = true;
        }
      }
      console.log(this.isExtensionMessageDisplayed);
    }, 2000);
  }

  ngOnInit(): void {

    this.browserName = (function (agent) {        switch (true) {
      case agent.indexOf("edge") > -1: return "MS Edge";
      case agent.indexOf("edg/") > -1: return "Edge ( chromium based)";
      case agent.indexOf("opr") > -1: return "Opera";
      case agent.indexOf("chrome") > -1: return "Chrome";
      case agent.indexOf("trident") > -1: return "MS IE";
      case agent.indexOf("firefox") > -1: return "Mozilla Firefox";
      case agent.indexOf("safari") > -1: return "Safari";
      default: return "other";
      }
    })(window.navigator.userAgent.toLowerCase());
    console.log(this.browserName)

    this.displayMessageExtension.emit(false);

    this.graphService.setD3Locale(); // initiate date for x graph 

    const draw = setInterval(() => {
      if (this.dataSumDbExtensionCo2TimeSerie.length > 0 && this.dataGlobalMeanCo2TimeSerie.length > 0){
        this.buildChart();
        clearInterval(draw);
      }
    }, 500);

    // Get global mean of all users
    this.lineDataApi
    .getGlobalData()
    .subscribe({

      next: (val) => {
        if (val && val.data) {
          this.dataGlobalMeanCo2TimeSerie = JSON.parse(val.data);
          this.graphService.formatDate(this.dataGlobalMeanCo2TimeSerie);
          console.log('# Get global data');
          console.log(this.dataGlobalMeanCo2TimeSerie);
        }
      },
    error: (error) => {
      console.log(error);
  }});

    this.lineDataApi
    .getData()
    .subscribe({
      next: (val) => {
        if (val && val.data) {
          this.dataDbCo2TimeSerie = JSON.parse(val.data);
          this.graphService.formatDate(this.dataDbCo2TimeSerie);
          console.log('# Database data');
          console.log(this.dataDbCo2TimeSerie);
          this.dataSumDbExtensionCo2TimeSerie = [...this.dataDbCo2TimeSerie]; // deep copy
          this.fillIndicators();
        }
        this.dataSumDbExtensionCo2TimeSerie = [...this.dataDbCo2TimeSerie]; // deep copy
      }
    });

    // Add an event listener that run the function when dimension change
    window.addEventListener('resize', updateOnResize);
    const _this = this;
    function updateOnResize() {
      // get the current width of the div where the chart appear, and attribute it to Svg
      if (_this.chartProps) {
        // const newWidth = document.body.clientWidth - 200;
        const newWidth = document.getElementById('chart')?.clientWidth;
        const newHeight = document.getElementById('chart')?.clientHeight;
        if (newWidth && newHeight) {
          console.log('# on resize');
          console.log(newWidth);
          console.log(newHeight);

          _this.chartProps.svg
          .attr("viewBox", '0 0 ' +  newWidth + ' ' +newHeight );

          _this.chartProps.x.range([ 0, newWidth - _this.chartProps.margin.left - _this.chartProps.margin.right ]);
          _this.chartProps.y.range([ newHeight - _this.chartProps.margin.top - _this.chartProps.margin.bottom, 0]);

          _this.chartProps.svgBox.select('.x.axis') // update x axis
          .attr('transform', `translate(0,${newHeight  - _this.chartProps.margin.top - _this.chartProps.margin.bottom})`)
          .call(_this.chartProps.xAxis, _this.chartProps.x);
          _this.chartProps.svgBox.select('.y.axis') // update y axis
          .call(_this.chartProps.yAxis, _this.chartProps.y);


          _this.chartProps.svgBox.select('.arrow')
          .attr("x", newWidth - 80 )
          .attr("y", newHeight -67);

          // update mouseemove 
          _this.chartProps.listeningRect
          .attr('width', newWidth)
          .attr('height', newHeight);

          _this.chartProps.width = newWidth - _this.chartProps.margin.left - _this.chartProps.margin.right;
          _this.chartProps.height = newHeight - _this.chartProps.margin.top - _this.chartProps.margin.bottom;

          _this.updateChart();
        }
      }
    }

    window.addEventListener('dataTotalCo2TimeSerie', (e: any) => {
      this.displayMessageExtension.emit(false);

      console.log('# extension data');
      console.log(e.detail);

      if (!this.isDataSaved) {
        this.firstDataExtensionCo2TimeSerie = e.detail;
        if (typeof this.firstDataExtensionCo2TimeSerie === 'string') {
          this.firstDataExtensionCo2TimeSerie = JSON.parse(this.firstDataExtensionCo2TimeSerie);
          this.graphService.formatDate(this.firstDataExtensionCo2TimeSerie);
          console.log(this.firstDataExtensionCo2TimeSerie);
        }
      } else {
        this.dataExtensionCo2TimeSerie = e.detail;
        if (typeof this.dataExtensionCo2TimeSerie === 'string') {
          this.dataExtensionCo2TimeSerie = JSON.parse(this.dataExtensionCo2TimeSerie);
          this.graphService.formatDate(this.dataExtensionCo2TimeSerie);
          console.log(this.dataExtensionCo2TimeSerie);
        }
      }
      if (this.firstDataExtensionCo2TimeSerie.length > 0 || this.dataExtensionCo2TimeSerie.length > 0) {
        if (!this.isDataSaved) {
          this.isDataSaved = true;

          dispatchEvent(new CustomEvent('dataTotalCo2TimeSerieReset', {detail: []}));
          console.log(this.dataDbCo2TimeSerie);
          console.log(this.firstDataExtensionCo2TimeSerie);
  
          // IF AN OTHER BROWSER INSTANCE IS RUNNING
          if (this.dataDbCo2TimeSerie.length > 0 && this.firstDataExtensionCo2TimeSerie.length > 5 && ((this.firstDataExtensionCo2TimeSerie[5].date < this.dataDbCo2TimeSerie[this.dataDbCo2TimeSerie.length - 1].date) || (this.firstDataExtensionCo2TimeSerie[0].co2 + 15 < this.dataDbCo2TimeSerie[this.dataDbCo2TimeSerie.length - 1].co2))) {
            // We look at index 5 because it we look at index 0, the date of extension is always few second below dataDb. Probably because of the way we refresh extension data and we store in db
            console.log('Instance issue');
            this.firstDataExtensionCo2TimeSerie = [];
          }
  
          if (this.dataExtensionCo2TimeSerie.length > 5  && this.dataExtensionCo2TimeSerie[5].date < this.dataDbCo2TimeSerie[this.dataDbCo2TimeSerie.length - 1].date || this.dataExtensionCo2TimeSerie.length > 5 &&  this.dataExtensionCo2TimeSerie[0].co2 + 15 < this.dataDbCo2TimeSerie[this.dataDbCo2TimeSerie.length - 1].co2) {
            console.log('this.dataExtensionCo2TimeSerie');
            console.log(this.dataExtensionCo2TimeSerie);
            this.dataExtensionCo2TimeSerie.map((x) => x.co2 =  this.dataDbCo2TimeSerie[this.dataDbCo2TimeSerie.length - 1].co2 + x.co2);
          }
  
          this.lineDataApi
          .getData()
          .subscribe({
            next: (val) => {
  
              if ((this.firstDataExtensionCo2TimeSerie && this.firstDataExtensionCo2TimeSerie.length > 0) || (this.dataDbCo2TimeSerie && this.dataDbCo2TimeSerie.length > 0)) {
                this.dataSumDbExtensionCo2TimeSerie = [...this.dataDbCo2TimeSerie]; // deep copy
                this.firstDataExtensionCo2TimeSerie.forEach((entry) => {
                  this.dataSumDbExtensionCo2TimeSerie.push(entry);
                });
              }
        
              if (val && val.data && this.dataDbCo2TimeSerie.length > 0) {
                this.updateData({
                  'category': 'internet',
                  'data': JSON.stringify(this.dataSumDbExtensionCo2TimeSerie)
                });
              } else {
                this.saveData({
                  'category': 'internet',
                  'data': JSON.stringify(this.dataSumDbExtensionCo2TimeSerie)
                });
              }
            },
            error: (err) => console.log(err.message)
          });
        } else {
          this.dataSumDbExtensionCo2TimeSerie = [...this.dataDbCo2TimeSerie]; // deep copy
          this.firstDataExtensionCo2TimeSerie.forEach((entry) => {  // fill with data extension when you were not on the website
            this.dataSumDbExtensionCo2TimeSerie.push(entry);
          });
          this.dataExtensionCo2TimeSerie.forEach((entry) => { // fill with data extension while you are on the website
            this.dataSumDbExtensionCo2TimeSerie.push(entry);
          });
        }
        this.fillIndicators();
  
        
        if (this.chartProps && this.dataSumDbExtensionCo2TimeSerie.length > 0) {
          this.updateChart();
        } else if (this.dataSumDbExtensionCo2TimeSerie.length > 0 && this.dataGlobalMeanCo2TimeSerie.length > 0) {
          this.buildChart();
        }
      }

    });

    const zoomButton = document.getElementById('zoomButton');
    zoomButton?.addEventListener('click', () => {
      if (this.zoom !== null) {
        if (zoomButton.className.includes('activated')) {
          document.body.style.cursor =  "auto";
          zoomButton.className = 'btn-graph';
          zoomButton.title = 'Zoomer';
          this.zoomTransform();
          this.chartProps.svgBox.on('.zoom', null);
        } else {
          document.body.style.cursor =  "all-scroll";
          zoomButton.title = 'Désactiver le zoom';
          zoomButton.className = 'activated';
          this.chartProps.svgBox.call(this.zoom as any, d3.zoomIdentity);
        }
        this.onZoom = !this.onZoom; // to disable update when we want to zoom/pan
      }
    });

    const globalDataButton = document.getElementById('global_data');
    globalDataButton?.addEventListener('click', () => {
      if (globalDataButton.className.includes('activated')) {
        this.graphService.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.marginYDomain);
        this.zoomTransform();
        this.chartProps.svgBox.on('.zoom', null);
        globalDataButton.className = 'btn-graph';
        d3.select('.line.line0').style("opacity", 0);
        d3.select('.circle_line0').style("opacity", 0);
        d3.select('.image_line0').style("opacity", 0);
      } else {
        const sumAllData = [...this.dataGlobalMeanCo2TimeSerie];
        this.dataDrawnCo2TimeSerie.forEach((data) => {
          sumAllData.push(data);
        });
        this.graphService.scaleXYDomain(sumAllData, this.chartProps.x, this.chartProps.y, this.marginYDomain);
        this.zoomTransform();
        this.chartProps.svgBox.on('.zoom', null);
        globalDataButton.className = 'activated';
        d3.select('.line.line0').style("opacity", 1);
        d3.select('.circle_line0').style("opacity", 1);
        d3.select('.image_line0').style("opacity", 1);
      }
    });

    const lastDayButton = document.getElementById('day');
    lastDayButton?.addEventListener('click', () => {
      console.log('Range : last day');
      let zoomActif = false;
      if (this.onZoom) {
        zoomActif = true;
        this.onZoom = false;
      }
      this.dataDbCo2TimeSerieFiltered = this.dataDbCo2TimeSerie.filter(d => new Date(d.date).getDate() === new Date().getDate());
      if (this.dataDbCo2TimeSerieFiltered.length === 0) {
        this.toastService.handleToast(toastType.Info, 'Pas de donnée enregistrée disponible pour aujourd\'hui');
      }
      this.updateChart();
      lastDayButton.className = 'activated';
      if (allButton) {
        allButton.className = 'btn-graph';
      }
      if (zoomActif) {
        this.onZoom = true;
      }
    });

    const allButton = document.getElementById('all');
    allButton?.addEventListener('click', () => {
      console.log('Range : all');
      let zoomActif = false;
      if (this.onZoom) {
        zoomActif = true;
        this.onZoom = false;
      }
      this.dataDbCo2TimeSerieFiltered = [];
      this.updateChart();
      this.fillIndicators();
      allButton.className = 'activated';
      if (lastDayButton) {
        lastDayButton.className = 'btn-graph';
      }
      if (zoomActif) {
        this.onZoom = true;
      }
    });
  }

  private saveData(data: any) {
    this.lineDataApi
      .saveData(data)
      .subscribe({
        next: () => {
          console.log('data saved to db');
        },
        error: (err) => console.log(err.message)
    });
  }

  private updateData(data: any) {
    this.lineDataApi
      .updateData(data)
      .subscribe({
        next: () => {
          console.log('data updated to db');
        },
        error: (err) => console.log(err.message)
      });
  }

  private buildChart() {
    console.log('i bluid chart');
    this.chartProps = {};
    
    this.dataDrawnCo2TimeSerie = this.graphService.reducePointsCo2TimeSerie(this.dataSumDbExtensionCo2TimeSerie);
    console.log(this.dataDrawnCo2TimeSerie);

    // Set the dimensions of the canvas / graph
    const margin = { top: 30, right: 20, bottom: 30, left: 50 };
    let width = 1244  - margin.left - margin.right;
    let height = 651  - margin.top - margin.bottom;

    const widthDivChart = document.getElementById('chart')?.clientWidth;
    const heightDivChart = document.getElementById('chart')?.clientHeight;
    if (widthDivChart && heightDivChart) {
      width = widthDivChart - margin.left - margin.right;
      height = heightDivChart - margin.top - margin.bottom;
    }
    
    const svg = d3.select(this.chartElement.nativeElement)
      .append('svg')
      // .attr('width', width + margin.left + margin.right)
      // .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', '0 0 ' + ( width + margin.left + margin.right)  + ' ' + (height + margin.top + margin.bottom));
      const svgBox = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set the ranges
    this.chartProps.x = d3.scaleTime().range([0, width]);
    this.chartProps.y = d3.scaleLinear().range([height, 0]);


    // Define the axes
    const xAxis = (g: any, x: any) => g
    .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(this.graphService.multiFormat).tickSize(0).tickPadding(width / 80));
    var yAxis = (g: any, y: any) => g
    .call(d3.axisLeft(y).tickPadding(height / 80).tickSizeOuter(0).tickSize(-150000));
  
    this.graphService.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.marginYDomain);

    this.selectedColor = this.listColors[1];
  
    // Add lines group
    this.glines = svgBox.append("g").attr("id", "lines");

    /// DRAW GLOBAL MEAN LINE
    if (this.dataGlobalMeanCo2TimeSerie && this.dataGlobalMeanCo2TimeSerie.length > 0) {
      this.dataGlobalMeanCo2TimeSerie = this.graphService.reducePointsCo2TimeSerie(this.dataGlobalMeanCo2TimeSerie);
      const valueline2: Line = new Line('line' + this.valueslines.length, this.dataGlobalMeanCo2TimeSerie,
      this.chartProps.x, this.chartProps.y, this.listColors[2]); // define the line
      valueline2.addToPath(this.glines); // add to path
      this.valueslines.push(valueline2);
    }

    // Add first line 
    let valueline: Line = new Line('line' + this.valueslines.length, this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.selectedColor); // create ligne
    valueline.addToPath(this.glines); // add to path

    this.valueslines.push(valueline);

    // Add the X Axis
    const gx = svgBox.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis, this.chartProps.x);

      svgBox.append('image')
      .attr("class", "arrow")
      .attr('xlink:href', "assets/arrow.png")
      .attr('width', 14)
      .attr('height', 14)
      .attr('x', width - 5)
      .attr('opacity', '1')
      .attr('y', height - 7);

    // Add the Y Axis
    const gy = svgBox.append('g')
      .attr('class', 'y axis')
      .call(yAxis, this.chartProps.y);

      gy.selectAll(".tick line").style("stroke-dasharray", "5 5").style("opacity", "0.3");
      gy.select('path').style("opacity", "0");

    // Setting the required objects in chartProps so they could be used to update the chart
    this.chartProps.svg = svg;
    this.chartProps.svgBox = svgBox;
    this.chartProps.xAxis = xAxis;
    this.chartProps.yAxis = yAxis;
    this.chartProps.height = height;
    this.chartProps.width = width;
    this.chartProps.margin = margin;

    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", 100)
    .attr("y", this.chartProps.height / 2)
    .style("font-size", "12px")
    .attr("dy", ".75em")
    .text("Co2(grammes)");

    this.zoom = d3.zoom()
    .on('zoom', (event) => {
      console.log('i zoom');
  

      this.xz = event.transform.rescaleX(this.chartProps.x);
      this.yz = event.transform.rescaleY(this.chartProps.y);

      gx.call(xAxis, this.xz);
      gy.call(yAxis, this.yz);

      gy.selectAll(".tick line").style("stroke-dasharray", "5 5").style("opacity", "0.3");
      gy.select('path').style("opacity", "0");

      this.valueslines.forEach( (line: Line) => {
        line.update(this.chartProps.svgBox, this.xz, this.yz);
        this.graphService.updateAvatarPosition(line.data, line.name, this.chartProps, this.xz, this.yz);
      });
    })
    .scaleExtent([1, 20]);


    // TOOLTIP
    // Add a circle under our tooltip, right over the “hovered” point
    this.tooltip = d3.select("#tooltip");
    this.tooltipCircle = svgBox
    .append("circle")
    .attr("class", "tooltip-circle")
    .attr("r", 4)
    .attr("stroke", "#af9358")
    .attr("fill", "white")
    .attr("stroke-width", 2)
    .style("opacity", 0);

    const xAxisLine = this.chartProps.svgBox
    .append("g")
    .append("rect")
    .attr("stroke", "#5c5c5c")
    .attr("stroke-dasharray", "5 1")
    .attr("stroke-width", "1px")
    .attr("fill", "none")
    .attr("width", ".5px");

    const yAxisLine = this.chartProps.svgBox
    .append("g")
    .append("rect")
    .attr("stroke", "#5c5c5c")
    .attr("stroke-dasharray", "5 1")
    .attr("stroke-width", "1px")
    .attr("fill", "none")
    .attr("height", ".5px");

    const listeningRect = svgBox
    .append("rect")
    .attr("fill", "transparent")
    .attr("width", width)
    .attr("height", height)
    .on("mousemove", onMouseMove)
    .on("mouseleave", onMouseLeave);

    this.chartProps.listeningRect = listeningRect;
    this.chartProps.xAxisLine = xAxisLine;
    this.chartProps.yAxisLine = yAxisLine;

    const _this = this;

    function onMouseMove(event: any) {
      console.log('# mouse move');
      const mousePosition = d3.pointer(event);

      let chartPropX;
      let chartPropY;
      if (_this.onZoom && _this.xz) {
        chartPropX = _this.xz;
        chartPropY = _this.yz;
      } else {
        chartPropX = _this.chartProps.x;
        chartPropY = _this.chartProps.y;
      }
      const hoveredDate = chartPropX.invert(mousePosition[0]);
      const hoveredCo2 = chartPropY.invert(mousePosition[1]);
  
      const yAccessor = (d: Co2ByOriginByTime) => d.co2;
      const xAccessor = (d: Co2ByOriginByTime) => d.date;
      const originAccessor = (d: Co2ByOriginByTime) => d.origin;
  
      const getDistanceFromHoveredDate = (d: Co2ByOriginByTime) => Math.abs((xAccessor(d) as unknown as number) - hoveredDate);
      const getDistanceFromHoveredCo2 = (d: Co2ByOriginByTime) => Math.abs((yAccessor(d) as unknown as number) - hoveredCo2);
      const closestIndex = d3.leastIndex(
        _this.dataDrawnCo2TimeSerie,
        (a: any, b: any) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
      );
      let closestDataPoint;
    

      if (closestIndex) {
        closestDataPoint = _this.dataDrawnCo2TimeSerie[closestIndex !== -1 ? closestIndex : 0];

        const Ymax = d3.max(_this.dataDrawnCo2TimeSerie, (d) => { return d.co2 + _this.marginYDomain; });
        const Xmax = Math.abs(xAccessor(_this.dataDrawnCo2TimeSerie[_this.dataDrawnCo2TimeSerie.length - 1]) - xAccessor(_this.dataDrawnCo2TimeSerie[0]));
        // console.log(Xmax);
        // console.log(Ymax);
        const maxDistDateFromMouseDisplay = Xmax ? Xmax * 2/10 : 0;
        const maxDistCo2FromMouseDisplay = Ymax ? Ymax * 2/10 : 0;
        // console.log('coef date : ', maxDistDateFromMouseDisplay);
        // console.log('coef co2 : ', maxDistCo2FromMouseDisplay);
        
        if (getDistanceFromHoveredCo2(_this.dataDrawnCo2TimeSerie[closestIndex]) > maxDistCo2FromMouseDisplay ||getDistanceFromHoveredDate(_this.dataDrawnCo2TimeSerie[closestIndex]) > maxDistDateFromMouseDisplay) {
          // console.log('date distance too far : ', getDistanceFromHoveredDate(_this.dataDrawnCo2TimeSerie[closestIndex]));
          // console.log('co2 distance too far : ', getDistanceFromHoveredCo2(_this.dataDrawnCo2TimeSerie[closestIndex]));
          onMouseLeave();
          return;
        }
      }
      else {
        closestDataPoint = _this.dataDrawnCo2TimeSerie[0];
      }
  
      const closestXValue = xAccessor(closestDataPoint);
      const closestYValue = yAccessor(closestDataPoint);
      const closestorigin = originAccessor(closestDataPoint);

      // We only print the co2 emitted since the beginning of the currently showing range of x
      const gCo2 = closestYValue - _this.dataDrawnCo2TimeSerie[0].co2;

      const kmByCar = Math.trunc(Math.round(1000 * gCo2 / _this.GESgCO2ForOneKmByCar) / 1000);
      const chargedSmartphones = Math.round(gCo2 / _this.GESgCO2ForOneChargedSmartphone);
  
      const formatDate = _this.graphService.d3Locale.format("%-d %b %Y à %H:%M");
      _this.tooltip.select("#start_date").text('Du ' + formatDate(xAccessor(_this.dataDrawnCo2TimeSerie[0]) as unknown as Date));
      _this.tooltip.select("#date").text('Au ' + formatDate(closestXValue as unknown as Date));
      _this.tooltip.select("#origin").html('sur : ' + closestorigin);
      _this.tooltip.select("#co2").html(gCo2 + ' gCO<sub>2</sub>e');
      _this.tooltip.select("#kmByCar").html(kmByCar + 'Kms');
      _this.tooltip.select("#chargedSmartphones").html(chargedSmartphones + ' charges');
      
      const x = chartPropX(closestXValue) + margin.left;
      const y = chartPropY(closestYValue) + margin.top;
  
      //Grab the x and y position of our closest point,
      //shift our tooltip, and hide/show our tooltip appropriately

      // console.log('x : ', x);
      // console.log('y ', y);

      if (x > _this.chartProps.width * 7/10 && y < _this.chartProps.height * 1/5) { // top right
        _this.tooltip.style(
          "transform",
          `translate(` + `calc(-50% + ${x}px),` + `calc(+40% + ${y}px)` + `)`
        );
      }
      else if (x < _this.chartProps.width * 1/10) { // left
        _this.tooltip.style(
          "transform",
          `translate(` + `calc(+40% + ${x}px),` + `calc(-80% + ${y}px)` + `)`
        );
      } else if (x > _this.chartProps.width * 7/10) { // right
        _this.tooltip.style(
          "transform",
          `translate(` + `calc(-50% + ${x}px),` + `calc(-80% + ${y}px)` + `)`
        );
      }
      else if (y > _this.chartProps.height * 7/10) { // bottom
        _this.tooltip.style(
          "transform",
          `translate(` + `calc(-5% + ${x}px),` + `calc(-80% + ${y}px)` + `)`
        )
      } else {
        _this.tooltip.style(
          "transform",
          `translate(` + `calc( -5% + ${x}px),` + `calc(+40% + ${y}px)` + `)`
        );
      }  

      _this.tooltip.style("opacity", 1);

      _this.tooltipCircle
        .attr("cx", chartPropX(closestXValue))
        .attr("cy", chartPropY(closestYValue))
        .style("opacity", 1);
  
      xAxisLine
      .attr("x", chartPropX(closestXValue))
      .attr("y", chartPropY(closestYValue))
      .attr("height", _this.chartProps.height - chartPropY(closestYValue))
      .style("opacity", 0.6);

      yAxisLine
      .attr("y", chartPropY(closestYValue))
      .attr("width", chartPropX(closestXValue))
      .style("opacity", 0.6);
    };

    function onMouseLeave() {
      _this.tooltip.style("opacity", 0);
      _this.tooltipCircle.style("opacity", 0);
      xAxisLine.style("opacity", 0);
      yAxisLine.style("opacity", 0);
    }

    // Add avatars for each Lines
    this.valueslines.forEach(line => {
      this.addAvatar(line, svgBox, 'assets/avatar_' + line.name + '.png', line.name);
      this.graphService.updateAvatarPosition(line.data, line.name, this.chartProps);
    });


    // by default we hide global data : 
    d3.select('.line.line0').style("opacity", 0);
    d3.select('.circle_line0').style("opacity", 0);
    d3.select('.image_line0').style("opacity", 0);
  }

  updateChart() {
    if (this.onZoom) {
      return;
    }
    console.log('update chart');

    if (this.dataDbCo2TimeSerieFiltered && this.dataDbCo2TimeSerieFiltered.length > 0) {
      this.dataDrawnCo2TimeSerie = [...this.dataDbCo2TimeSerieFiltered];
    }
    else if (this.dataDbCo2TimeSerie && this.dataDbCo2TimeSerie.length > 0) {
      this.dataDrawnCo2TimeSerie = [...this.dataDbCo2TimeSerie];
    } else {
      this.dataDrawnCo2TimeSerie = [];
    }

    this.firstDataExtensionCo2TimeSerie.forEach((entry) => {  // fill with data extension when you were not on the website
      this.dataDrawnCo2TimeSerie.push(entry);
    });

    // reduce nbre of points by 20 and put it in dataDrawnCo2TimeSerie
    this.dataDrawnCo2TimeSerie = this.graphService.reducePointsCo2TimeSerie(this.dataDrawnCo2TimeSerie);

    this.dataExtensionCo2TimeSerie.forEach((entry) => {
      this.dataDrawnCo2TimeSerie.push(entry);
    });


    if (this.valueslines.length > 1) {
      this.valueslines[1].data = this.dataDrawnCo2TimeSerie;
    } else {
      this.valueslines[0].data = this.dataDrawnCo2TimeSerie;
    }


    const globalDataButton = document.getElementById('global_data');
    const allButton = document.getElementById('all');
    if (globalDataButton?.className.includes('activated') && allButton?.className.includes('activated')) {
      const sumAllData = [...this.dataGlobalMeanCo2TimeSerie];
      this.dataDrawnCo2TimeSerie.forEach((data) => {
        sumAllData.push(data);
      });
      this.graphService.scaleXYDomain(sumAllData, this.chartProps.x, this.chartProps.y, this.marginYDomain);
    } else {
      this.graphService.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.marginYDomain);
    }

    // let lastOriginValue = this.dataDrawnCo2TimeSerie[this.dataDrawnCo2TimeSerie.length - 1].origin;

    // if (lastOriginValue && this.currentOrigin && this.dataDrawnCo2TimeSerie && this.currentOrigin !== lastOriginValue) { // if different origin
    //   console.log('New Line');
    //   this.valueslines[this.valueslines.length - 1].data = [...this.valueslines[this.valueslines.length - 1].data]; // Deep copy of current line data
    //   this.selectedColor = this.listColors[Math.trunc(Math.random() * 4)];
    //   // Add new line
    //   this.currentOrigin = lastOriginValue;
    //   const valueline: Line = new Line('line' + this.valueslines.length, [], this.chartProps.x, this.chartProps.y, this.selectedColor, this.currentOrigin); // define the line
    //   valueline.addToPath(this.glines); // add to path

    //   this.valueslines.push(valueline);
    // } else if (this.valueslines.length > 1) {
    //   this.valueslines[this.valueslines.length - 1].data = [...this.dataDrawnCo2TimeSerie.slice(this.getIndexNewLine())];
    // }

    // update all lines : 
    this.valueslines.forEach( (line: Line) => {
      line.update(this.chartProps.svgBox, this.chartProps.x, this.chartProps.y);
      this.graphService.updateAvatarPosition(line.data, line.name, this.chartProps);
    });
    console.log(this.valueslines);

    this.chartProps.svgBox.transition();

    this.chartProps.svgBox.select('.x.axis') // update x axis
    .call(this.chartProps.xAxis, this.chartProps.x);

    this.chartProps.svgBox.select('.y.axis') // update y axis
      .call(this.chartProps.yAxis, this.chartProps.y);

    this.chartProps.svgBox.selectAll(".tick line").style("stroke-dasharray", "5 5").style("opacity", "0.3");
    // this.chartProps.svgBox.select('path').style("opacity", "0");

  }

  private addAvatar(valueline: Line, svgBox: any, avatar: string, lineName: string) {
    const pos = valueline.selectPath(svgBox).node().getPointAtLength(valueline.selectPath(svgBox).node().getTotalLength());
    svgBox.append("circle")
    .style("stroke", "gray")
    .style("fill", "white")
    .attr("class", "circle_" + lineName)
    .attr("r", 14)
    .attr("cx", pos.x+ 20)
    .attr("cy", pos.y);
    svgBox.append('image')
    .attr("class", "image_" + lineName)
    .attr('xlink:href', avatar)
    .attr('width', 25)
    .attr('height', 25)
    .attr('x', pos.x + 7)
    .attr('y', pos.y - 13);
  }

  public zoomTransform(): void {
    this.chartProps.svgBox.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  public closeMessageOverlay(): void {
    const dont_show = document.getElementById('dont_show');
    if (dont_show && (dont_show as HTMLInputElement).checked) {
      localStorage.setItem('install_extension_message_display', 'false');
    }
    const message = document.getElementById('install_extension_message');
    if (message)
    {
      message.style.display = 'none';
    }
  }

  private fillIndicators(): void {
    const co2_max = document.getElementById('co2_max');
    const kmByCar_max = document.getElementById('kmByCar_max');
    const chargedSmartphones_max = document.getElementById('chargedSmartphones_max');
    if (this.dataSumDbExtensionCo2TimeSerie && this.dataSumDbExtensionCo2TimeSerie.length > 2) {
      if (co2_max) {
        co2_max.innerHTML = (this.dataSumDbExtensionCo2TimeSerie[this.dataSumDbExtensionCo2TimeSerie.length - 2].co2 as unknown as string) + ' gCO<sub>2</sub>e';
      }

    
      if (kmByCar_max) {
        const kmByCar = Math.trunc(Math.round(1000 * this.dataSumDbExtensionCo2TimeSerie[this.dataSumDbExtensionCo2TimeSerie.length - 2].co2 / this.GESgCO2ForOneKmByCar) / 1000);

        kmByCar_max.innerHTML = kmByCar + ' Kms';
      }
      if (chargedSmartphones_max) {
        const chargedSmartphones = Math.round(this.dataSumDbExtensionCo2TimeSerie[this.dataSumDbExtensionCo2TimeSerie.length - 2].co2 / this.GESgCO2ForOneChargedSmartphone);

        chargedSmartphones_max.innerHTML = chargedSmartphones + ' charges';
      }
    }
  }
}
