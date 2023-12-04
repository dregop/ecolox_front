import { AfterContentInit, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Line } from '../models/line';
import { LineDataApiService } from './services/line-data-api.service';
import { GraphService } from './services/graph.service';
import { ToastService, toastType } from '../services/toast.service';

export  class Co2ByOriginByTime {
  co2!: number;
  date!: any;
  origin?: string;
}

@Component({
  selector: 'chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, AfterContentInit {
  @ViewChild('chart') chartElement!: ElementRef;

  parseDate = d3.timeParse('%d-%m-%Y');

  public dataExtensionCo2TimeSerie: Co2ByOriginByTime[] = [];
  public firstDataExtensionCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataSumDbExtensionCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataDbCo2TimeSerie: Co2ByOriginByTime[] = [];
  public dataGlobalMeanCo2TimeSerie: Co2ByOriginByTime[] = [];
  private GESgCO2ForOneKmByCar = 220;
  private GESgCO2ForOneChargedSmartphone = 8.3;
  private isDataSaved = false;
  public isExtensionMessageDisplayed = false;
  public browserName: string = "Chrome";
  public chartBuilt = false;

  @Output() public displayMessageExtension = new EventEmitter<boolean>();
  @Output() public buildLineChart = new EventEmitter<any>();
  @Output() public updateLineChart = new EventEmitter<any>();

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
  
        
        if (this.chartBuilt && this.dataSumDbExtensionCo2TimeSerie.length > 0) {
          this.updateLineChart.emit();
        } else if (this.dataSumDbExtensionCo2TimeSerie.length > 0 && this.dataGlobalMeanCo2TimeSerie.length > 0) {
          this.buildLineChart.emit();
          this.chartBuilt = true;
        }
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
