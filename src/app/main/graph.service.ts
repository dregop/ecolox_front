import { Injectable, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Line } from '../models/line';
import { Co2ByOriginByTime } from './main.component';
import { LineDataApiService } from '../services/line-data-api.service';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  public d3Locale!: d3.TimeLocaleObject;
  public zoom!: any;

  constructor(private lineDataApi: LineDataApiService) {}

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
    formatWeek = this.d3Locale.format("%b %d"),
    formatMonth = this.d3Locale.format("%B"),
    formatYear = this.d3Locale.format("%Y");
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatSecond
        : d3.timeHour(date) < date ? formatMinute
        : d3.timeDay(date) < date ? formatHour
        : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
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
      y.domain([data[0].co2 - marginYDomain, d3.max(data, function (d) { return d.co2 + marginYDomain; })]); // define the range of y axis
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
}
