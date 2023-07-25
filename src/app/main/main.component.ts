import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Line } from './line';

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

  dataTotalCo2TimeSerie!: Co2ByOriginByTime[];
  splittedByCategData!: any[];
  private chartProps: any;
  private glines: any;
  private currentValueLine!: any;
  private valueslines: Line[] = [];
  private zoom!: any;
  private onZoom = false;
  private currentOrigin!: any;
  private selectedColor!: string;
  private listColors = ['green', 'orange', 'red', 'yellow'];
  private currentDataTotalCo2!: Co2ByOriginByTime;
  private marginYDomain = 50;

  private formatDate() {
    this.dataTotalCo2TimeSerie.forEach(ms => {
      if (typeof ms.date === 'string') {
        ms.date = this.parseDate(ms.date);
      }
    });
  }

  constructor() {
  }

  ngOnInit(): void {
    window.addEventListener('dataTotalCo2TimeSerie', (e: any) => {
      this.dataTotalCo2TimeSerie = e.detail;
      console.log(this.dataTotalCo2TimeSerie);
      // if (!this.dataTotalCo2FromExtension) {
      //   dispatchEvent(new CustomEvent('dataTotalCo2TimeSerieReset', {detail: this.dataTotalCo2FromExtension}));
      // }
      // this.showStats();
      if (this.dataTotalCo2TimeSerie &&  this.chartProps) {
        this.updateChart();
      } else if (this.dataTotalCo2TimeSerie) {
        this.buildChart();
      }
    });
    // window.addEventListener('currentDataTotalCo2', (e: any) => {
    //   this.currentDataTotalCo2 = e.detail;
    //   console.log(e.detail);
    //   const div = document.getElementById('co2');
    //   if (div) {
    //     div.innerHTML = this.currentDataTotalCo2.co2 as unknown as string;
    //   }
    // });


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

  private buildChart() {
    console.log('i bluid chart');
    this.chartProps = {};
    this.formatDate();

  
    // Set the dimensions of the canvas / graph
    var margin = { top: 30, right: 20, bottom: 30, left: 40 },
      width = 1000 - margin.left - margin.right,
      height = 650 - margin.top - margin.bottom;
  
    // Set the ranges
    this.chartProps.x = d3.scaleTime().range([0, width]);
    this.chartProps.y = d3.scaleLinear().range([height, 0]);

    // Define the axes
    const xAxis = (g: any, x: any) => g
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    var yAxis = (g: any, y: any) => g
    .call(d3.axisLeft(y).tickPadding(height / 80).tickSizeOuter(0));
    
    const svg = d3.select(this.chartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    this.scaleXYDomain(this.dataTotalCo2TimeSerie, this.chartProps.x, this.chartProps.y);

    this.selectedColor = this.listColors[Math.trunc(Math.random() * 4)];
  
    // Add lines group
    this.glines = svg.append("g").attr("id", "lines");

    // define current origin by last origin of values
    this.currentOrigin = this.dataTotalCo2TimeSerie[this.dataTotalCo2TimeSerie.length - 2].origin;

    // Add first line
    let valueline: Line = new Line('line2', this.dataTotalCo2TimeSerie, this.chartProps.x, this.chartProps.y, this.selectedColor, this.currentOrigin); // create the ligne
    valueline.addToPath(this.glines); // add to path

    this.currentValueLine = valueline;
    this.valueslines.push(valueline);
    // Add the X Axis
    const gx = svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis, this.chartProps.x);
  
    // Add the Y Axis
    const gy = svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis, this.chartProps.y);

    // Add avatar
    const pos = valueline.selectPath(svg).node().getPointAtLength(valueline.selectPath(svg).node().getTotalLength());
    svg.append("circle")
    .style("stroke", "gray")
    .style("fill", "white")
    .attr("r", 14)
    .attr("cx", pos.x+ 20)
    .attr("cy", pos.y);
    svg.append('image')
    .attr('xlink:href', 'assets/avatar.png')
    .attr('width', 25)
    .attr('height', 25)
    .attr('x', pos.x + 7)
    .attr('y', pos.y - 13);
  
    // Setting the required objects in chartProps so they could be used to update the chart
    this.chartProps.svg = svg;
    this.chartProps.valueline2 = valueline;
    this.chartProps.xAxis = xAxis;
    this.chartProps.yAxis = yAxis;

    this.zoom = d3.zoom()
    .on('zoom', (event) => {
      console.log('i zoom');

      const xz = event.transform.rescaleX(this.chartProps.x);
      const yz = event.transform.rescaleY(this.chartProps.y);

      gx.call(xAxis, xz);
      gy.call(yAxis, yz);

      valueline.update(this.chartProps.svg, xz, yz); // update the current line

      this.chartProps.valueline3?.update(this.chartProps.svg, xz, yz);

      // update all lines : 
      this.valueslines.forEach( (line: Line) => {
        line.update(this.chartProps.svg, xz, yz);
      });

      this.updateAvatarPosition();
    })
    .scaleExtent([1, 20]);
  }

  updateChart() {
    console.log('i update chart');
    let _this = this;
    this.formatDate();
    let fullRange: Co2ByOriginByTime[] = [];
    let newData = null;

    if (this.onZoom) {
      return;
    }

    // let lastOriginValue = this.dataTotalCo2TimeSerie[this.dataTotalCo2TimeSerie.length - 2].origin;
    // console.log(lastOriginValue);
    // console.log(this.currentOrigin);

    // if (lastOriginValue && this.currentOrigin && this.dataTotalCo2TimeSerie && this.currentOrigin !== lastOriginValue) { // if different origin
    //   newData = [this.dataTotalCo2TimeSerie[this.dataTotalCo2TimeSerie.length - 2]];
    //   this.dataTotalCo2TimeSerie.map( (data: Co2ByOriginByTime) => {
    //     fullRange.push(data);
    //   });
    //   newData.map( (data: Co2ByOriginByTime) => {
    //     fullRange.push(data);
    //   });
    //   this.chartProps.x.domain(d3.extent(fullRange, (d) => {
    //     if (d.date instanceof Date) {
    //       return d.date.getTime();
    //     } else  {
    //       return null;
    //     }
    //   }));
    //   this.chartProps.y.domain([this.dataTotalCo2TimeSerie[0].co2 - this.marginYDomain, d3.max(fullRange, function (d) { return d.co2 + _this.marginYDomain; })]);
    // } else {
      this.scaleXYDomain(this.dataTotalCo2TimeSerie, this.chartProps.x, this.chartProps.y);
    // }

    // if (newData) { // if newData because of new origin => we create new line
    //   console.log('New Line !!!!!!!!!!!')
      
    //   this.selectedColor = this.listColors[Math.trunc(Math.random() * 4)];
    //   // Add new line
    //   this.currentOrigin = lastOriginValue;
    //   const valueline: Line = new Line('line' + this.valueslines.length, newData, this.chartProps.x, this.chartProps.y, this.selectedColor, this.currentOrigin); // define the line
    //   valueline.addToPath(this.glines); // add to path
      
    //   this.currentValueLine = valueline;
    //   this.valueslines.push(valueline);
    // }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// RESTE A FAIRE => voir comment stocker la data pour chaques lignes et l'updater
    /// => voir aussi comment afficher les différentes lignes (en fonction des catégories) stockés par l'extension
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // update all lines : 
    this.valueslines.forEach( (line: Line) => {
      line.data = this.dataTotalCo2TimeSerie;
      line.update(this.chartProps.svg, this.chartProps.x, this.chartProps.y);
    });

    this.chartProps.svg.transition();

    this.chartProps.svg.select('.x.axis') // update x axis
    .call(this.chartProps.xAxis, this.chartProps.x);

    this.chartProps.svg.select('.y.axis') // update y axis
      .call(this.chartProps.yAxis, this.chartProps.y);

    this.updateAvatarPosition();
  }

  private updateAvatarPosition() {
    let lastValueLinePath = this.currentValueLine.selectPath(this.chartProps.svg);
    let pos = lastValueLinePath.node().getPointAtLength(lastValueLinePath.node().getTotalLength() - 20);
    this.chartProps.svg.select('circle')
    .attr("cx", pos.x+ 20)
    .attr("cy", pos.y);
    this.chartProps.svg.select('image')
    .attr('x', pos.x + 7)
    .attr('y', pos.y - 13);
  }

  private reset() {
    this.chartProps.svg.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }
}
