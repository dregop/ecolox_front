import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Co2ByOriginByTime } from '../chart.component';
import { Line } from '../../models/line';
import { GraphService } from '../services/graph.service';
import { ToastService, toastType } from 'src/app/services/toast.service';

@Component({
  selector: 'line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit {

  @ViewChild('chart') chartElement!: ElementRef;

  parseDate = d3.timeParse('%d-%m-%Y');

  public dataDbCo2TimeSerieFiltered: Co2ByOriginByTime[] = [];
  public dataDrawnCo2TimeSerie: Co2ByOriginByTime[] = [];
  public chartProps: any;
  private glines: any;
  private valueslines: Line[] = [];
  private zoom!: any;
  private onZoom = false;
  private selectedColor!: string;
  private listColors = ['green', 'orange', 'red', 'yellow'];
  private xz: any;
  private yz: any;
  public isExtensionMessageDisplayed = false;
  public browserName: string = "Chrome"; 
  @Input() public dataDb: Co2ByOriginByTime[] = [];
  @Input() public dataExt: Co2ByOriginByTime[] = [];
  @Input() public dataGlobal: Co2ByOriginByTime[] = [];
  @Input() public firstDataExt: Co2ByOriginByTime[] = [];
  @Input() public dataSumDbExt: Co2ByOriginByTime[] = [];
  constructor(private graphService: GraphService, public toastService: ToastService) {
  }
  
  ngOnInit(): void {
    this.graphService.setD3Locale(); // initiate date for x graph 

    const draw = setInterval(() => {
      if (this.dataSumDbExt.length > 0 && this.dataGlobal.length > 0){
        this.buildChart();
        clearInterval(draw);
      }
    }, 500);

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
          .attr("x", newWidth - 50 - _this.chartProps.margin.top )
          .attr("y", newHeight -37 - _this.chartProps.margin.bottom);

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

    const zoomButton = document.getElementById('zoomButton');
    zoomButton?.addEventListener('click', () => {
      if (this.zoom !== null) {
        if (zoomButton.className.includes('activated')) {
          document.body.style.cursor =  "auto";
          zoomButton.className = 'btn-graph';
          zoomButton.title = 'Zoomer';
          this.chartProps.svgBox.transition()
          .duration(750)
          .call(this.zoom.transform, d3.zoomIdentity);
          this.chartProps.svgBox.on('.zoom', null);
        } else {
          document.body.style.cursor =  "all-scroll";
          zoomButton.title = 'Désactiver le zoom';
          zoomButton.className = 'btn-graph activated';
          this.chartProps.svgBox.call(this.zoom as any, d3.zoomIdentity);
        }
        this.onZoom = !this.onZoom; // to disable update when we want to zoom/pan
        this.graphService.$onZoom.next(this.onZoom); // propage to graphService
      }
    });

    const globalDataButton = document.getElementById('global_data');
    globalDataButton?.addEventListener('click', () => {
      if (globalDataButton.className.includes('activated')) {
        this.graphService.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.graphService.marginYDomain);
        this.zoomTransform();
        this.chartProps.svgBox.on('.zoom', null);
        globalDataButton.className = 'btn-graph';
        d3.select('.line.line0').style("opacity", 0);
        d3.select('.circle_line0').style("opacity", 0);
        d3.select('.image_line0').style("opacity", 0);
      } else {
        const sumAllData = [...this.dataGlobal];
        this.dataDrawnCo2TimeSerie.forEach((data) => {
          sumAllData.push(data);
        });
        if (!lastDayButton?.className.includes('activated')) {
          this.graphService.scaleXYDomain(sumAllData, this.chartProps.x, this.chartProps.y, this.graphService.marginYDomain);
          this.zoomTransform();
          this.chartProps.svgBox.on('.zoom', null);
        }
        globalDataButton.className = 'btn-graph activated';
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
      this.dataDbCo2TimeSerieFiltered = this.dataDb.filter(d => new Date(d.date).getDate() === new Date().getDate());
      if (this.dataDbCo2TimeSerieFiltered.length === 0) {
        this.toastService.handleToast(toastType.Info, 'Pas de donnée enregistrée disponible pour aujourd\'hui');
      }
      lastDayButton.className = 'btn-graph activated';
    
      if (allButton) {
        allButton.className = 'btn-graph';
      }
      this.updateChart();
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
      allButton.className = 'btn-graph activated';     
      // this.fillIndicators(); //TODO: check impact
      if (lastDayButton) {
        lastDayButton.className = 'btn-graph';
      }
      this.updateChart();
      if (zoomActif) {
        this.onZoom = true;
      }
    });    
  }

  private buildChart() {
    console.log('i bluid chart');
    this.chartProps = {};
    
    this.dataDrawnCo2TimeSerie = this.graphService.reducePointsCo2TimeSerie(this.dataSumDbExt);
    console.log(this.dataDrawnCo2TimeSerie);
    // propage 
    this.graphService.$dataDrawnCo2TimeSerie.next(this.dataDrawnCo2TimeSerie);

    // Set the dimensions of the graph
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
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
    .call(d3.axisBottom(x).tickFormat(this.graphService.multiFormat).tickSize(0).tickPadding(width / 80));
    var yAxis = (g: any, y: any) => g
    .call(d3.axisLeft(y).tickPadding(height / 80).tickSizeOuter(0).tickSize(-150000));
  
    this.graphService.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.graphService.marginYDomain);

    this.selectedColor = this.listColors[1];
  
    // Add lines group
    this.glines = svgBox.append("g").attr("id", "lines");

    /// DRAW GLOBAL MEAN LINE
    if (this.dataGlobal && this.dataGlobal.length > 0) {
      this.dataGlobal = this.graphService.reducePointsCo2TimeSerie(this.dataGlobal);
      const valueline2: Line = new Line('line' + this.valueslines.length, this.dataGlobal,
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

    this.chartProps.height = height;
    this.chartProps.width = width;

      svgBox.append('image')
      .attr("class", "arrow")
      .attr('xlink:href', "assets/arrow.png")
      .attr('width', 14)
      .attr('height', 14)
      .attr('x', this.chartProps.width - 5)
      .attr('opacity', '1')
      .attr('y', this.chartProps.height - 7);

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
    this.chartProps.margin = margin;

    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", 100)
    .attr("y", this.chartProps.height / 2)
    .style("font-size", "12px")
    .attr("dy", ".75em")
    .text("Co2(grammes)");

    // ZOOM
    this.zoom = d3.zoom()
    .on('zoom', (event) => this.graphService.chartZoom(event, this.chartProps, gx, gy, xAxis, yAxis, this.valueslines))
    .scaleExtent([1, 20]);

    // TOOLTIP
    this.graphService.buildTooltip(this.chartProps);

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

    // which data to draw 
    if (this.dataDbCo2TimeSerieFiltered && this.dataDbCo2TimeSerieFiltered.length > 0) {
      this.dataDrawnCo2TimeSerie = [...this.dataDbCo2TimeSerieFiltered];
    }
    else if (this.dataDb && this.dataDb.length > 0) {
      this.dataDrawnCo2TimeSerie = [...this.dataDb];
    } else {
      this.dataDrawnCo2TimeSerie = [];
    }

    this.firstDataExt.forEach((entry) => {  // fill with data extension stored when you were not on the website
      this.dataDrawnCo2TimeSerie.push(entry);
    });

    this.dataDrawnCo2TimeSerie = this.graphService.reducePointsCo2TimeSerie(this.dataDrawnCo2TimeSerie);

    this.dataExt.forEach((entry) => {
      this.dataDrawnCo2TimeSerie.push(entry);
    });


    // propage 
    this.graphService.$dataDrawnCo2TimeSerie.next(this.dataDrawnCo2TimeSerie);

    // update lines data
    if (this.valueslines.length > 1) {
      this.valueslines[1].data = this.dataDrawnCo2TimeSerie;
    } else {
      this.valueslines[0].data = this.dataDrawnCo2TimeSerie;
    }


    const globalDataButton = document.getElementById('global_data');
    const allButton = document.getElementById('all');
    if (globalDataButton?.className.includes('activated') && allButton?.className.includes('activated')) {
      const sumAllData = [...this.dataGlobal];
      this.dataDrawnCo2TimeSerie.forEach((data) => {
        sumAllData.push(data);
      });
      console.log(sumAllData.length);
      this.graphService.scaleXYDomain(sumAllData, this.chartProps.x, this.chartProps.y, this.graphService.marginYDomain);
    } else {
      this.graphService.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.graphService.marginYDomain);
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
}
