import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Line } from '../models/line';
import { LineDataApiService } from '../services/line-data-api.service';

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
export class MainComponent implements OnInit {
  @ViewChild('chart') chartElement!: ElementRef;

  parseDate = d3.timeParse('%d-%m-%Y');

  public dataExtensionCo2TimeSerie!: Co2ByOriginByTime[];
  public dataDrawnCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataSumDbExtensionCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataDbCo2TimeSerie: Co2ByOriginByTime[] = [];
  private splittedByCategData!: any[];
  private chartProps: any;
  private glines: any;
  private valueslines: Line[] = [];
  private zoom!: any;
  private onZoom = false;
  private currentOrigin!: any;
  private selectedColor!: string;
  private listColors = ['green', 'orange', 'red', 'yellow'];
  private marginYDomain = 50;
  private tooltip!: any;
  private tooltipCircle!: any;

  constructor(private lineDataApi: LineDataApiService) {
  }

  ngOnInit(): void {
    let saveData = false;

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
          _this.chartProps.svg
          .attr("viewBox", '0 0 ' +  newWidth + ' ' +newHeight );
          // .attr("width", newWidth)
          // .attr("height", newHeight);

          // _this.chartProps.svgBox
          // .attr('transform', `translate(${_this.chartProps.margin.left},${_this.chartProps.margin.top})`);
        
          // Update the X scale and Axis (here the 20 is just to have a bit of margin)
          _this.chartProps.x.range([ 0, newWidth - _this.chartProps.margin.left - _this.chartProps.margin.right ]);
          _this.chartProps.y.range([ newHeight - _this.chartProps.margin.top - _this.chartProps.margin.bottom, 0]);
          _this.chartProps.svgBox.select('.x.axis') // update x axis
          .attr('transform', `translate(0,${newHeight  - _this.chartProps.margin.top - _this.chartProps.margin.bottom})`)
          .call(_this.chartProps.xAxis, _this.chartProps.x);

          _this.chartProps.svgBox.select('.y.axis') // update y axis
          .call(_this.chartProps.yAxis, _this.chartProps.y);

          // update movemove 
          _this.chartProps.listeningRect
          .attr('width', newWidth)
          .attr('height', newHeight);


          _this.chartProps.height = newHeight - _this.chartProps.margin.top - _this.chartProps.margin.bottom;
  
        }
      }
    }

    window.addEventListener('dataTotalCo2TimeSerie', (e: any) => {
      this.dataExtensionCo2TimeSerie = e.detail;
      console.log('# extension data');
      console.log(this.dataExtensionCo2TimeSerie);

      if (!saveData) {
        saveData = true;
        this.lineDataApi
        .getData()
        .subscribe({
          next: (val) => {
            if (val && val.length > 0) {
              this.dataDbCo2TimeSerie = JSON.parse(val[val.length - 1].data);
              this.formatDate(this.dataDbCo2TimeSerie);
              console.log('# Database data');
              console.log(this.dataDbCo2TimeSerie);
            }

            if (this.dataExtensionCo2TimeSerie) {
              this.dataSumDbExtensionCo2TimeSerie = [...this.dataDbCo2TimeSerie]; // deep copy
              this.dataExtensionCo2TimeSerie.forEach((entry) => {
                this.dataSumDbExtensionCo2TimeSerie.push(entry);
              });
            }
    
            // if the extension has been reset to 0 or reinstalled or if it's a new computer  -- 50 just to make sure we are indeed below 
            if (this.dataExtensionCo2TimeSerie && this.dataDbCo2TimeSerie && this.dataExtensionCo2TimeSerie.length > 0 && this.dataDbCo2TimeSerie.length > 0 &&
              this.dataExtensionCo2TimeSerie[0].co2 + 50 < this.dataDbCo2TimeSerie[this.dataDbCo2TimeSerie.length - 1].co2) {
                const confirmMessage = confirm('Nous avons détecté une remise à zéro de l\'extension ou une nouvelle installation. ' +
                'Confirmez vous d\'ajouter les nouvelles données à venir à celles déjà existantes pour votre compte ou annulez et repartez depuis les nouvelles données de l\'extension seulement ?');
                if (confirmMessage) {
                  // this to reset data from extension and load previous data into extension
                  dispatchEvent(new CustomEvent('dataTotalCo2TimeSerieReset', {detail: this.dataSumDbExtensionCo2TimeSerie}));
                } else {
                  // reset to 0
                  dispatchEvent(new CustomEvent('dataTotalCo2TimeSerieReset', {detail: []}));
                  this.dataSumDbExtensionCo2TimeSerie = [...this.dataExtensionCo2TimeSerie];
                  // replace in db TODO
                  this.updateData({
                    'category': 'internet',
                    'data': JSON.stringify([])
                  });
                }
            } else {
              dispatchEvent(new CustomEvent('dataTotalCo2TimeSerieReset', {detail: []}));
            }
            if (val && val.length === 0) {
              this.saveData({
                'category': 'internet',
                'data': JSON.stringify(this.dataSumDbExtensionCo2TimeSerie)
              });
            }
            this.updateData({
              'category': 'internet',
              'data': JSON.stringify(this.dataSumDbExtensionCo2TimeSerie)
            });
          },
          error: (err) => console.log(err.message)
        });
      }

      const div = document.getElementById('co2');
      if (div && this.dataExtensionCo2TimeSerie && this.dataExtensionCo2TimeSerie.length > 2) {
        div.innerHTML = this.dataExtensionCo2TimeSerie[this.dataExtensionCo2TimeSerie.length - 2].co2 as unknown as string;
      }


      if (this.dataSumDbExtensionCo2TimeSerie &&  this.chartProps) {
        this.updateChart();
      } else if (this.dataSumDbExtensionCo2TimeSerie && this.dataSumDbExtensionCo2TimeSerie.length > 0) {
        this.buildChart();
      }
    });

    const zoomButton = document.getElementById('zoomButton');
    zoomButton?.addEventListener('click', () => {
      if (this.zoom !== null) {
        d3.select('svg').call(this.zoom as any, d3.zoomIdentity);
        this.onZoom = !this.onZoom; // to disable update when we want to zoom/pan
      }
    });

    const resetButton = document.getElementById('reset');
    resetButton?.addEventListener('click', () => {
      if (this.zoom !== null) {
        this.reset();
      }
    });

    const lastDayButton = document.getElementById('day');
    lastDayButton?.addEventListener('click', () => {
      this.dataSumDbExtensionCo2TimeSerie = this.dataSumDbExtensionCo2TimeSerie.filter(d => (new Date(d.date).getDate() === new Date().getDate()));
      this.updateChart();
    });

    const allButton = document.getElementById('all');
    allButton?.addEventListener('click', () => {
      this.dataSumDbExtensionCo2TimeSerie = [...this.dataDbCo2TimeSerie]; // deep copy
      this.dataExtensionCo2TimeSerie.forEach((entry) => {
        this.dataSumDbExtensionCo2TimeSerie.push(entry);
      });
      this.updateChart();
    });
  }

  private formatDate(data: Co2ByOriginByTime[]) {
    data.forEach(ms => {
      if (typeof ms.date === 'string') {
        ms.date = new Date(ms.date);
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

  private scaleXYDomain(data: Co2ByOriginByTime[], x: any, y: any) {
    let _this = this;
    // Scale the range of the data
    x.domain(
      d3.extent(data, (d) => {
        if (d.date instanceof Date) {
          return (d.date as Date).getTime();
        }
        else {
          return null;
        }
      }));
      y.domain([data[0].co2 - this.marginYDomain, d3.max(data, function (d) { return d.co2 + _this.marginYDomain; })]); // define the range of y axis
      // i want y axis to start at the first value recorded not zéro so that it is nicer to see
  }

  private reducePointsCo2TimeSerie(data: Co2ByOriginByTime[]): Co2ByOriginByTime[] { // very approximative, need to refactor this function
    let i = 0;
    let reducedData: Co2ByOriginByTime[] = [];
    const dataGroupedCo2TimeSerie = d3.group(data, (d) => {return d.co2;});
    if (dataGroupedCo2TimeSerie.size < 100 || data.length < 5000) {
      return data;
    }
    const nbreToDivideBy = Math.trunc(dataGroupedCo2TimeSerie.size / (10 * Math.log(dataGroupedCo2TimeSerie.size)));
    dataGroupedCo2TimeSerie.forEach((entry: any) => {
      i++;
      if (i % nbreToDivideBy === 0){
        reducedData.push(entry[0]);
      }
    });
    return reducedData;
  }

  private buildChart() {
    console.log('i bluid chart');
    this.chartProps = {};
    
    this.dataDrawnCo2TimeSerie = this.reducePointsCo2TimeSerie(this.dataSumDbExtensionCo2TimeSerie);
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
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
    var yAxis = (g: any, y: any) => g
    .call(d3.axisLeft(y).tickPadding(height / 80).tickSizeOuter(0));
  
    this.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y);

    this.selectedColor = this.listColors[1];
  
    // Add lines group
    this.glines = svgBox.append("g").attr("id", "lines");

    // define current origin by last origin of values
    this.currentOrigin = this.dataDrawnCo2TimeSerie[this.dataDrawnCo2TimeSerie.length - 2].origin;

    // Add first line 
    let valueline: Line = new Line('line' + this.valueslines.length, this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.selectedColor, this.currentOrigin); // create the ligne
    valueline.addToPath(this.glines); // add to path

    this.valueslines.push(valueline);
    // Add the X Axis
    const gx = svgBox.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis, this.chartProps.x);
  
    // Add the Y Axis
    const gy = svgBox.append('g')
      .attr('class', 'y axis')
      .call(yAxis, this.chartProps.y);

    // Add avatar
    const pos = valueline.selectPath(svgBox).node().getPointAtLength(valueline.selectPath(svgBox).node().getTotalLength());
    svgBox.append("circle")
    .style("stroke", "gray")
    .style("fill", "white")
    .attr("r", 14)
    .attr("cx", pos.x+ 20)
    .attr("cy", pos.y);
    svgBox.append('image')
    .attr('xlink:href', 'assets/avatar.png')
    .attr('width', 25)
    .attr('height', 25)
    .attr('x', pos.x + 7)
    .attr('y', pos.y - 13);
  
    // Setting the required objects in chartProps so they could be used to update the chart
    this.chartProps.svg = svg;
    this.chartProps.svgBox = svgBox;
    this.chartProps.valueline2 = valueline;
    this.chartProps.xAxis = xAxis;
    this.chartProps.yAxis = yAxis;
    this.chartProps.height = height;
    this.chartProps.width = width;
    this.chartProps.margin = margin;

    this.zoom = d3.zoom()
    .on('zoom', (event) => {
      console.log('i zoom');

      const xz = event.transform.rescaleX(this.chartProps.x);
      const yz = event.transform.rescaleY(this.chartProps.y);

      gx.call(xAxis, xz);
      gy.call(yAxis, yz);

      valueline.update(this.chartProps.svgBox, xz, yz); // update the current line

      // this.chartProps.valueline3?.update(this.chartProps.svg, xz, yz);

      this.updateAvatarPosition();
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
      const hoveredDate = _this.chartProps.x.invert(mousePosition[0]);
      const hoveredCo2 = _this.chartProps.y.invert(mousePosition[1]);
  
      const yAccessor = (d: Co2ByOriginByTime) => d.co2;
      const xAccessor = (d: Co2ByOriginByTime) => d.date;
  
      const getDistanceFromHoveredDate = (d: Co2ByOriginByTime) => Math.abs((xAccessor(d) as unknown as number) - hoveredDate);
      const getDistanceFromHoveredCo2 = (d: Co2ByOriginByTime) => Math.abs((yAccessor(d) as unknown as number) - hoveredCo2);
      const closestIndex = d3.leastIndex(
        _this.dataDrawnCo2TimeSerie,
        (a: any, b: any) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
      );
      
      let closestDataPoint;
      if (closestIndex) {
        closestDataPoint = _this.dataDrawnCo2TimeSerie[closestIndex !== -1 ? closestIndex : 0];
        if (getDistanceFromHoveredDate(_this.dataDrawnCo2TimeSerie[closestIndex]) > 15000000 || getDistanceFromHoveredCo2(_this.dataDrawnCo2TimeSerie[closestIndex]) > 100) {
          // console.log('date distance too far : ', getDistanceFromHoveredDate(_this.dataDrawnCo2TimeSerie[closestIndex]) > 15000000);
          // console.log('co2 distance too far : ', getDistanceFromHoveredCo2(_this.dataDrawnCo2TimeSerie[closestIndex]) > 150);
          onMouseLeave();
          return;
        }
      }
      else {
        closestDataPoint = _this.dataDrawnCo2TimeSerie[0];
      }
  
      const closestXValue = xAccessor(closestDataPoint);
      const closestYValue = yAccessor(closestDataPoint);
  
      const formatDate = d3.timeFormat("%H:%M %B %A %-d, %Y");
      _this.tooltip.select("#date").text(formatDate(closestXValue as unknown as Date));
  
      const formatInternetUsage = (d: number | { valueOf(): number; }) => `${d3.format(".1f")(d)} grammes`;
      _this.tooltip.select("#internet").html(formatInternetUsage(closestYValue));
  
      const x = _this.chartProps.x(closestXValue) + margin.left;
      const y =_this.chartProps.y(closestYValue) + margin.top;
  
      //Grab the x and y position of our closest point,
      //shift our tooltip, and hide/show our tooltip appropriately-
  
      _this.tooltip.style(
        "transform",
        `translate(` + `calc( 20% + ${x}px),` + `calc(-50% + ${y}px)` + `)`
      );

      // _this.tooltip.style('top', (_this.chartProps.y(closestYValue)) + 'px').style('left', (_this.chartProps.x(closestXValue)) + 'px');
  
      _this.tooltip.style("opacity", 1);
  
      _this.tooltipCircle
        .attr("cx", _this.chartProps.x(closestXValue))
        .attr("cy", _this.chartProps.y(closestYValue))
        .style("opacity", 1);
  
      xAxisLine
      .attr("x", _this.chartProps.x(closestXValue))
      .attr("y", _this.chartProps.y(closestYValue))
      .attr("height", _this.chartProps.height - _this.chartProps.y(closestYValue))
      .style("opacity", 0.6);

      yAxisLine
      .attr("y", _this.chartProps.y(closestYValue))
      .attr("width", _this.chartProps.x(closestXValue))
      .style("opacity", 0.6);
    };

    function onMouseLeave() {
      _this.tooltip.style("opacity", 0);
      _this.tooltipCircle.style("opacity", 0);
      xAxisLine.style("opacity", 0);
      yAxisLine.style("opacity", 0);
    }

    this.updateAvatarPosition();
  }

  private getIndexNewLine() {
    let index = 0;
    let count = 0;
    while( count < this.valueslines.length - 1) {
      index += this.valueslines[count].data.length;
      count++;
    }
    return index;
  }

  updateChart() {
    this.dataDrawnCo2TimeSerie = [...this.dataSumDbExtensionCo2TimeSerie]; // deep copy
    // reduce nbre of points by 20 and put it in dataDrawnCo2TimeSerie
    this.dataDrawnCo2TimeSerie = this.reducePointsCo2TimeSerie(this.dataDrawnCo2TimeSerie);

    this.dataExtensionCo2TimeSerie.forEach((entry) => {
      this.dataDrawnCo2TimeSerie.push(entry);
    });
    this.valueslines[0].data = this.dataDrawnCo2TimeSerie;

    if (this.onZoom) {
      return;
    }
    this.scaleXYDomain(this.dataDrawnCo2TimeSerie, this.chartProps.x, this.chartProps.y);
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
    });
    console.log(this.valueslines);

    this.chartProps.svgBox.transition();

    this.chartProps.svgBox.select('.x.axis') // update x axis
    .call(this.chartProps.xAxis, this.chartProps.x);

    this.chartProps.svgBox.select('.y.axis') // update y axis
      .call(this.chartProps.yAxis, this.chartProps.y);

    this.updateAvatarPosition();
  }

  private updateAvatarPosition() {
    const yAccessor = (d: Co2ByOriginByTime) => d.co2;
    const xAccessor = (d: Co2ByOriginByTime) => d.date;

    const xLastPos = this.chartProps.x(xAccessor(this.dataDrawnCo2TimeSerie[this.dataDrawnCo2TimeSerie.length - 1]));
    const yLastPos = this.chartProps.y(yAccessor(this.dataDrawnCo2TimeSerie[this.dataDrawnCo2TimeSerie.length - 1]));

    this.chartProps.svgBox.select('circle')
    .attr("cx", xLastPos)
    .attr("cy", yLastPos);
    this.chartProps.svgBox.select('image')
    .attr("x", xLastPos - 12)
    .attr("y", yLastPos - 13);
  }

  private reset() {
    this.chartProps.svgBox.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }
}
