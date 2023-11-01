import { Injectable, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Line } from '../models/line';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  public d3Locale!: d3.TimeLocaleObject;
  public zoom!: any;

  constructor() {}

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
}
