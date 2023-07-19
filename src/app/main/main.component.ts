import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

export  class MarketPrice {
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

  @Input() dataTotalCo2!: MarketPrice[];
  splittedByCategData!: any[];

  private chartProps: any;

  formatDate() {
    this.dataTotalCo2.forEach(ms => {
      if (typeof ms.date === 'string') {
        ms.date = this.parseDate(ms.date);
      }
    });
  }

  private zoom!: any;
  private onZoom = false;

  private listOriginByBytes!: any;
  private currentOrigin!: string;
  private selectedColor!: string;
  private listColors = ['green', 'orange', 'red', 'yellow'];
  private totalCo2: number = 0;
  private defaultLocation = 'regionOther';
  private userLocation = this.defaultLocation;
  public duration: number = 0;
  public fakeDuration!: Date;
  
  private defaultCarbonIntensityFactorIngCO2PerKWh = 519;
  private kWhPerByteDataCenter = 0.000000000072;
  private kWhPerByteNetwork = 0.000000000152;
  private kWhPerMinuteDevice = 0.00021;
  
  private GESgCO2ForOneKmByCar = 220;
  private GESgCO2ForOneChargedSmartphone = 8.3;
  
  private carbonIntensityFactorIngCO2PerKWh: any  = {
    'regionEuropeanUnion': 276,
    'regionFrance': 34.8,
    'regionUnitedStates': 493,
    'regionChina': 681,
    'regionOther': this.defaultCarbonIntensityFactorIngCO2PerKWh
  };

  private linechart!: any;

  constructor() {
  }

  ngOnInit(): void {
    window.addEventListener('duration', (e: any) => {
      this.duration = e.detail;
    });   
    window.addEventListener('co2', (e: any) => {
      this.listOriginByBytes = e.detail.stats;
      this.currentOrigin = e.detail.origin;
      this.showStats();
      if (this.dataTotalCo2 &&  this.chartProps) {
        this.updateChart();
      } else if (this.dataTotalCo2) {
        this.buildChart();
      }

      const div = document.getElementById('co2');
      if (div) {
        div.innerHTML = this.totalCo2 as unknown as string;
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
  }

  private getStats = () => {
    const stats = this.listOriginByBytes;
    let total = 0;
    const sortedStats = [];
  
    for (let origin in stats) {
      total += stats[origin];
      sortedStats.push({ 'origin': origin, 'byte': stats[origin] });
    }
  
    sortedStats.sort(function(a, b) {
      return a.byte < b.byte ? 1 : a.byte > b.byte ? -1 : 0
    });
  
    const highestStats = sortedStats.slice(0, 4);
    let subtotal = 0;
    for (let index in highestStats) {
      subtotal += highestStats[index].byte;
    }
  
    if (total > 0) {
      const remaining = total - subtotal;
      if (remaining > 0) {
        highestStats.push({'origin': 'statsOthers', 'byte': remaining});
      }
  
      highestStats.forEach(function (item: any) {
        item.percent = Math.round(100 * item.byte / total)
      });
    }
  
    return {
      'total': total,
      'highestStats': highestStats as any
    }
  }

  showStats = async () => {
    console.log("show stats");
    const stats = this.getStats();
    if (stats.total === 0) {
      return;
    }
  
    const kWhDataCenterTotal = stats.total * this.kWhPerByteDataCenter;
    const GESDataCenterTotal = kWhDataCenterTotal * this.defaultCarbonIntensityFactorIngCO2PerKWh;
  
    const kWhNetworkTotal = stats.total * this.kWhPerByteNetwork;
    const GESNetworkTotal = kWhNetworkTotal * this.defaultCarbonIntensityFactorIngCO2PerKWh;
  
    const kWhDeviceTotal = this.duration * this.kWhPerMinuteDevice;
    const GESDeviceTotal = kWhDeviceTotal * this.carbonIntensityFactorIngCO2PerKWh[this.userLocation];
  
    const kWhTotal = Math.round(1000 * (kWhDataCenterTotal + kWhNetworkTotal + kWhDeviceTotal)) / 1000;
    const gCO2Total = Math.round(GESDataCenterTotal + GESNetworkTotal + GESDeviceTotal);

    this.totalCo2 = gCO2Total;
    const date = new Date;
      
    if (this.splittedByCategData && this.splittedByCategData.length > 0) {
      this.splittedByCategData.push({'date': date, 'co2': this.totalCo2, origin: this.currentOrigin});
    } else if (!this.onZoom) {
      this.dataTotalCo2.push({'date': date, 'co2': this.totalCo2, origin: this.currentOrigin});
    }

    this.fakeDuration = new Date;
    this.fakeDuration.setMinutes(55);
  
    const kmByCar = Math.round(1000 * gCO2Total / this.GESgCO2ForOneKmByCar) / 1000;
    const chargedSmartphones = Math.round(gCO2Total / this.GESgCO2ForOneChargedSmartphone);
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
    var xAxis = d3.axisBottom(this.chartProps.x);
    var yAxis = d3.axisLeft(this.chartProps.y).ticks(5);
  
    let _this = this;
    // Define the line
    const valueline2 = d3.line<MarketPrice>()
      .x(function (d) {
        if (d.date instanceof Date) {
          return _this.chartProps.x(d.date.getTime());
        } 
      })
      .y(function (d) { return _this.chartProps.y(d.co2); });
    
    const svg = d3.select(this.chartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Scale the range of the data
    this.chartProps.x.domain(
      d3.extent(_this.dataTotalCo2, (d) => {
        if (d.date instanceof Date) {
          return (d.date as Date).getTime();
        }
        else {
          return null;
        }
      }));
      this.chartProps.y.domain([this.dataTotalCo2[0].co2, d3.max(this.dataTotalCo2, function (d) { return Math.max(d.co2) + 50; })]); // define the range of y axis
      // i want y axis to start at the first value recorded not zéro so that it is nicer to see

    this.selectedColor = this.listColors[Math.trunc(Math.random() * 4)];
  
    // Add the valueline2 path.
    this.linechart = svg.append('path')
      .attr('class', 'line line2')
      .style('stroke', 'blue')
      .style('fill', 'none')
      .style("stroke-width", 2)
      // .style("stroke-dasharray", ("3, 6"))  // <== This line here!!
      .attr('d', valueline2(_this.dataTotalCo2));  

    // Add the X Axis
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);
  
    // Add the Y Axis
    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
  
    // Setting the required objects in chartProps so they could be used to update the chart
    this.chartProps.svg = svg;
    this.chartProps.valueline2 = valueline2;
    this.chartProps.xAxis = xAxis;
    this.chartProps.yAxis = yAxis;

    this.zoom = d3.zoom()
    .extent([[margin.left, 0], [width - margin.right, height]])
    .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
    .on('zoom', (event) => {

      this.chartProps.x
        .domain(event.transform.rescaleX(this.chartProps.x))
        .range([0, width].map(d => event.transform.applyX(d))); // apply zoom for x range

      this.chartProps.y
        .domain(event.transform.rescaleX(this.chartProps.y))
        .range([height, 0].map(d => event.transform.applyY(d))); //apply zoom for y range

        this.chartProps.x.domain(d3.extent(this.dataTotalCo2, (d) => {
          if (d.date instanceof Date) {
            return d.date.getTime();
          } else  {
            return null;
          }
        }));
      
        this.chartProps.y.domain([this.dataTotalCo2[0].co2, d3.max(this.dataTotalCo2, function (d) { return Math.max(d.co2) + 50; })]);

        this.chartProps.svg.select('.line.line2') // update the current line
        .attr('d', this.chartProps.valueline2(this.dataTotalCo2));
        
        this.chartProps.svg.select('.x.axis') // update x axis
        .call(this.chartProps.xAxis);
    
        this.chartProps.svg.select('.y.axis') // update y axis
        .call(this.chartProps.yAxis);


      // svg.selectAll('path.line').attr('d', this.linechart); 
    })
    .scaleExtent([1, 25]);
  }

  updateChart() {
    let _this = this;
    this.formatDate();

    if (this.onZoom) {
      return;
    }
  
    // Scale the range of the data again
    if (this.splittedByCategData && this.splittedByCategData.length > 0) {
      let fullRange: MarketPrice[] = [];
      this.dataTotalCo2.map( (data: MarketPrice) => {
        fullRange.push(data);
      });
      this.splittedByCategData.map( (data: MarketPrice) => {
        fullRange.push(data);
      });
      this.chartProps.x.domain(d3.extent(fullRange, (d) => {
        if (d.date instanceof Date) {
          return d.date.getTime();
        } else  {
          return null;
        }
      }));
    
      this.chartProps.y.domain([this.dataTotalCo2[0].co2, d3.max(this.splittedByCategData, function (d) { return Math.max(d.co2) + 50; })]);
    
      // Select the section we want to apply our changes to
      this.chartProps.svg.transition();

      console.log('i update line3');
      this.chartProps.svg.select('.line.line3') // update the current line
      .attr('d', this.chartProps.valueline1(this.splittedByCategData));

      console.log('i update line2');
      this.chartProps.svg.select('.line.line2') // update the current line
      .attr('d', this.chartProps.valueline2(this.dataTotalCo2));

    } else {
      
      this.chartProps.x.domain(d3.extent(this.dataTotalCo2, (d) => {
        if (d.date instanceof Date) {
          return d.date.getTime();
        } else  {
          return null;
        }
      }));
    
      this.chartProps.y.domain([this.dataTotalCo2[0].co2, d3.max(this.dataTotalCo2, function (d) { return Math.max(d.co2) + 50; })]);
    
      // Select the section we want to apply our changes to
      this.chartProps.svg.transition();
      // if (this.currentOrigin && this.dataTotalCo2 && this.currentOrigin === this.dataTotalCo2[this.dataTotalCo2.length - 2].origin) { // si c'est toujours la meme origin
      if (this.dataTotalCo2 && (this.dataTotalCo2[this.dataTotalCo2.length - 2].date < this.fakeDuration || this.chartProps.valueline1)) {
          if (this.chartProps.valueline1) {
            console.log('i update line3');
            this.chartProps.svg.select('.line.line3') // update the current line
            .attr('d', this.chartProps.valueline1(this.splittedByCategData));
          } else {
            console.log('i update line2');
            this.chartProps.svg.select('.line.line2') // update the current line
            .attr('d', this.chartProps.valueline2(this.dataTotalCo2));
          }
      } else if (this.dataTotalCo2 && !this.chartProps.valueline1) {
        console.log('new line3');
        // Define the line
  
        console.log(d3);
        const valueline1 = d3.line<MarketPrice>()
        .x(function (d) {
          if (d.date instanceof Date) {
            return _this.chartProps.x(d.date.getTime());
          } 
        })
        .y(function (d) { return _this.chartProps.y(d.co2); });
  
        this.splittedByCategData = [this.dataTotalCo2[this.dataTotalCo2.length - 2]];
        console.log(this.splittedByCategData);

        this.selectedColor = this.listColors[Math.trunc(Math.random() * 4)];
  
        // Add the new path.
        this.linechart = this.chartProps.svg.append('path')
          .attr('class', 'line line3')
          .style('stroke', 'green')
          .style('fill', 'none')
          .style("stroke-width", 2)
          // .style("stroke-dasharray", ("3, 6"))  // <== This line here!!
          .attr('d', valueline1(this.splittedByCategData));
  
        // Setting the required objects in chartProps so they could be used to update the chart
        this.chartProps.valueline1 = valueline1;
      }
    }

    this.chartProps.svg.select('.x.axis') // update x axis
      .call(this.chartProps.xAxis);
  
    this.chartProps.svg.select('.y.axis') // update y axis
      .call(this.chartProps.yAxis);


    // Add avatar on the lineChart 
    let pos = this.linechart.node().getPointAtLength(this.linechart.node().getTotalLength() - 20);
    d3.select("circle").remove();
    this.chartProps.svg
    .append("circle")
    .style("stroke", "gray")
    .style("fill", "white")
    .attr("r", 14)
    .attr("cx", pos.x+ 20)
    .attr("cy", pos.y);

    d3.select("image").remove();
    this.chartProps.svg.append('image')
    .attr('xlink:href', 'assets/avatar.png')
    .attr('width', 25)
    .attr('height', 25)
    .attr('x', pos.x + 7)
    .attr('y', pos.y - 13);
  }

  private reset() {
    this.chartProps.svg.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }
}
