import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

export  class MarketPrice {
  co2!: number;
  date!: any;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  @ViewChild('chart') chartElement!: ElementRef;

  parseDate = d3.timeParse('%d-%m-%Y');

  @Input() marketStatus!: MarketPrice[];

  private svgElement!: HTMLElement;
  private chartProps: any;

  formatDate() {
    this.marketStatus.forEach(ms => {
      if (typeof ms.date === 'string') {
        ms.date = this.parseDate(ms.date);
      }
    });
  }
  private extensionData!: any;
  private totalCo2: number = 0;
  private defaultLocation = 'regionOther';
  private userLocation = this.defaultLocation;
  public duration: number = 0;
  
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
      console.log(e.detail);
    });   
    window.addEventListener('co2', (e: any) => {
      this.extensionData = e.detail;
      console.log(e.detail);
      this.showStats();
      if (this.marketStatus &&  this.chartProps) {
        this.updateChart();
      } else if (this.marketStatus) {
        this.buildChart();
      }

      const div = document.getElementById('co2');
      if (div) {
        div.innerHTML = this.totalCo2 as unknown as string;
      }
    });
  }

  ngOnChanges() {
    console.log('on change');
  }

  private getStats = () => {
    const stats = this.extensionData;
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
  
  
    for (let index in stats.highestStats) {
      if (stats.highestStats[index].percent < 1) {
        continue;
      }
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

    this.marketStatus.push({'date': new Date, 'co2': this.totalCo2});
  
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
    var valueline2 = d3.line<MarketPrice>()
      .x(function (d) {
        if (d.date instanceof Date) {
          return _this.chartProps.x(d.date.getTime());
        } 
      })
      .y(function (d) { return _this.chartProps.y(d.co2); });
  
    var svg = d3.select(this.chartElement.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Scale the range of the data
    this.chartProps.x.domain(
      d3.extent(_this.marketStatus, (d) => {
        if (d.date instanceof Date) {
          return (d.date as Date).getTime();
        }
        else {
          return null;
        }
      }));
    this.chartProps.y.domain([0, d3.max(this.marketStatus, function (d) {
      return Math.max(d.co2);
    })]);
  
    // Add the valueline2 path.
    this.linechart = svg.append('path')
      .attr('class', 'line line2')
      .style('stroke', 'green')
      .style('fill', 'none')
      .style("stroke-width", 2)
      // .style("stroke-dasharray", ("3, 6"))  // <== This line here!!
      .attr('d', valueline2(_this.marketStatus));
  
  
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
  }

  updateChart() {
    let _this = this;
    this.formatDate();
  
    // Scale the range of the data again
    this.chartProps.x.domain(d3.extent(this.marketStatus, (d) => {
      if (d.date instanceof Date) {
        return d.date.getTime();
      } else  {
        return null;
      }
    }));
  
    this.chartProps.y.domain([0, d3.max(this.marketStatus, function (d) { return Math.max(d.co2); })]);
  
    // Select the section we want to apply our changes to
    this.chartProps.svg.transition();
  
    this.chartProps.svg.select('.line.line2') // update the line
      .attr('d', this.chartProps.valueline2(this.marketStatus));
  
    this.chartProps.svg.select('.x.axis') // update x axis
      .call(this.chartProps.xAxis);
  
    this.chartProps.svg.select('.y.axis') // update y axis
      .call(this.chartProps.yAxis);

    let pos = this.linechart.node().getPointAtLength(this.linechart.node().getTotalLength() - 20);
    console.log(this.linechart.node().getTotalLength());

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
}
