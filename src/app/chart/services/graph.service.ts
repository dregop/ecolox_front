import { Injectable, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Line } from '../../models/line';
import { Co2ByOriginByTime } from '../chart.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  public d3Locale!: d3.TimeLocaleObject;
  public $zoom!: Subject<any>;
  public $onZoom!: BehaviorSubject<boolean>; // if you subscribe to it, you get notified when the value's subject is changed
  private onZoom!: boolean;
  public $dataDrawnCo2TimeSerie!: BehaviorSubject<any>;
  private dataDrawnCo2TimeSerie!: Co2ByOriginByTime[];
  public $xz!: BehaviorSubject<any>;
  public $yz!: BehaviorSubject<any>;
  private xz!: any;
  private yz!: any;
  private tooltip!: any;
  private tooltipCircle!: any;
  private GESgCO2ForOneKmByCar = 220;
  private GESgCO2ForOneChargedSmartphone = 8.3;
  public marginYDomain = 50;

  constructor() {
    this.$onZoom = new BehaviorSubject(false);
    this.$xz = new BehaviorSubject(null);
    this.$yz = new BehaviorSubject(null);
    this.$dataDrawnCo2TimeSerie = new BehaviorSubject(null);
    this.$onZoom.subscribe((bool) => {
      this.onZoom = bool; // onZoom subscibed to $onZoom and will update automaticly when $onZoom 's subject value changes
    });
    this.$xz.subscribe((xz) => {
      this.xz = xz;
    });
    this.$yz.subscribe((yz) => {
      this.yz = yz;
    });
    this.$dataDrawnCo2TimeSerie.subscribe((dataDrawnCo2TimeSerie) => {
      this.dataDrawnCo2TimeSerie = dataDrawnCo2TimeSerie;
    });
  }

  public setD3Locale(): void {
    this.d3Locale = d3.timeFormatLocale({
      "dateTime": "%A, %e %B %Y г. %X",
      "date": "%d.%m.%Y",
      "time": "%H:%M:%S",
      "periods": [":00", ":00"],
      "days": ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
      "shortDays": ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      "months": ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
      "shortMonths": ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jui", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    });
  }

  public multiFormat(date: any) {
    this.d3Locale = d3.timeFormatLocale({
      "dateTime": "%A, %e %B %Y г. %X",
      "date": "%d.%m.%Y",
      "time": "%H:%M:%S",
      "periods": [":00", ":00"],
      "days": ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
      "shortDays": ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      "months": ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
      "shortMonths": ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jui", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    });
    const formatMillisecond = this.d3Locale.format(".%L"),
    formatSecond = this.d3Locale.format(":%S"),
    formatMinute = this.d3Locale.format("%H:%M"),
    formatHour = this.d3Locale.format("%H %p"),
    formatDay = this.d3Locale.format("%a %d"),
    formatMonth = this.d3Locale.format("%d %b"),
    formatYear = this.d3Locale.format("%Y");
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatSecond
        : d3.timeHour(date) < date ? formatMinute
        : d3.timeDay(date) < date ? formatHour
        : d3.timeMonth(date) < date ? formatDay
        : d3.timeYear(date) < date ? formatMonth
        : formatYear)(date);
  }

  public formatDate(data: Co2ByOriginByTime[]) {
    data.forEach(ms => {
      if (typeof ms.date === 'string') {
        ms.date = new Date(ms.date);
      }
    });
  }

  public scaleXYDomain(data: Co2ByOriginByTime[], x: any, y: any, marginYDomain: number) {
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
      y.domain([d3.min(data, function (d) { return d.co2 }), d3.max(data, function (d) { return d.co2 + marginYDomain; })]); // define the range of y axis
      // i want y axis to start at the first value recorded not zéro so that it is nicer to see
  }

  public reducePointsCo2TimeSerie(data: Co2ByOriginByTime[]): Co2ByOriginByTime[] { // very approximative, need to refactor this function
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

  public updateAvatarPosition(dataTimeSerie: Co2ByOriginByTime[], lineName: string, chartProps: any, xz?: any, yz?: any) {
    const yAccessor = (d: Co2ByOriginByTime) => d.co2;
    const xAccessor = (d: Co2ByOriginByTime) => d.date;

    let xLastPos;
    let yLastPos;
    if (xz && yz) {
      xLastPos = xz(xAccessor(dataTimeSerie[dataTimeSerie.length - 1]));
      yLastPos = yz(yAccessor(dataTimeSerie[dataTimeSerie.length - 1]));
    } else {
      xLastPos = chartProps.x(xAccessor(dataTimeSerie[dataTimeSerie.length - 1]));
      yLastPos = chartProps.y(yAccessor(dataTimeSerie[dataTimeSerie.length - 1]));
    }

    chartProps.svgBox.select('.circle_' + lineName)
    .attr("cx", xLastPos)
    .attr("cy", yLastPos);
    chartProps.svgBox.select('.image_' + lineName)
    .attr("x", xLastPos - 12)
    .attr("y", yLastPos - 13);
  }

  public getIndexNewLine(valueslines: Line[]) {
    let index = 0;
    let count = 0;
    while( count < valueslines.length - 1) {
      index += valueslines[count].data.length;
      count++;
    }
    return index;
  }

  public buildTooltip(chartProps: any) {
    // Add a circle under our tooltip, right over the “hovered” point
    this.tooltip = d3.select("#tooltip");
    this.tooltipCircle = chartProps.svgBox
    .append("circle")
    .attr("class", "tooltip-circle")
    .attr("r", 4)
    .attr("stroke", "#af9358")
    .attr("fill", "white")
    .attr("stroke-width", 2)
    .style("opacity", 0);

    const xAxisLine = chartProps.svgBox
    .append("g")
    .append("rect")
    .attr("stroke", "#5c5c5c")
    .attr("stroke-dasharray", "5 1")
    .attr("stroke-width", "1px")
    .attr("fill", "none")
    .attr("width", ".5px");

    const yAxisLine = chartProps.svgBox
    .append("g")
    .append("rect")
    .attr("stroke", "#5c5c5c")
    .attr("stroke-dasharray", "5 1")
    .attr("stroke-width", "1px")
    .attr("fill", "none")
    .attr("height", ".5px");

    const listeningRect = chartProps.svgBox
    .append("rect")
    .attr("fill", "transparent")
    .attr("width", chartProps.width)
    .attr("height", chartProps.height)
    .on("mousemove", onMouseMove)
    .on("mouseleave", onMouseLeave);

    chartProps.listeningRect = listeningRect;
    chartProps.xAxisLine = xAxisLine;
    chartProps.yAxisLine = yAxisLine;
    
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
        chartPropX = chartProps.x;
        chartPropY = chartProps.y;
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
  
      const formatDate = _this.d3Locale.format("%-d %b %Y à %H:%M");
      _this.tooltip.select("#start_date").text('Du ' + formatDate(xAccessor(_this.dataDrawnCo2TimeSerie[0]) as unknown as Date));
      _this.tooltip.select("#date").text('Au ' + formatDate(closestXValue as unknown as Date));
      _this.tooltip.select("#origin").html('sur : ' + closestorigin);
      _this.tooltip.select("#co2").html(gCo2 + ' gCO<sub>2</sub>e');
      _this.tooltip.select("#kmByCar").html(kmByCar + 'Kms');
      _this.tooltip.select("#chargedSmartphones").html(chargedSmartphones + ' charges');
      
      const x = chartPropX(closestXValue) + chartProps.margin.left;
      const y = chartPropY(closestYValue) + chartProps.margin.top;
  
      //Grab the x and y position of our closest point,
      //shift our tooltip, and hide/show our tooltip appropriately

      // console.log('x : ', x);
      // console.log('y ', y);

      if (x > chartProps.width * 7/10 && y < chartProps.height * 1/5) { // top right
        _this.tooltip.style(
          "transform",
          `translate(` + `calc(-50% + ${x}px),` + `calc(+40% + ${y}px)` + `)`
        );
      }
      else if (x < chartProps.width * 1/10) { // left
        _this.tooltip.style(
          "transform",
          `translate(` + `calc(+40% + ${x}px),` + `calc(-80% + ${y}px)` + `)`
        );
      } else if (x > chartProps.width * 7/10) { // right
        _this.tooltip.style(
          "transform",
          `translate(` + `calc(-50% + ${x}px),` + `calc(-80% + ${y}px)` + `)`
        );
      }
      else if (y > chartProps.height * 7/10) { // bottom
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
      .attr("height", chartProps.height - chartPropY(closestYValue))
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
  }

  public updateTooltip() {

  }

  public chartZoom(event: any, chartProps: any, gx: any, gy: any, xAxis: any, yAxis: any, valueslines: Line[]) {
    {
      console.log('i zoom');
  

      this.xz = event.transform.rescaleX(chartProps.x);
      this.yz = event.transform.rescaleY(chartProps.y);

      // propagate to graphService
      this.$xz.next(this.xz);
      this.$yz.next(this.yz);
      

      gx.call(xAxis, this.xz);
      gy.call(yAxis, this.yz);

      gy.selectAll(".tick line").style("stroke-dasharray", "5 5").style("opacity", "0.3");
      gy.select('path').style("opacity", "0");

      valueslines.forEach( (line: Line) => {
        line.update(chartProps.svgBox, this.xz, this.yz);
        this.updateAvatarPosition(line.data, line.name, chartProps, this.xz, this.yz);
      });
    }
  }
}
