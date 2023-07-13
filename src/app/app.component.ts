import { Component } from '@angular/core';
import { MarketPrice } from './main/main.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  marketStatus!: MarketPrice[];
  marketStatusToPlot: MarketPrice[] = [];

  set MarketStatus(status: MarketPrice[]) {
    this.marketStatus = status;
    this.marketStatusToPlot = this.marketStatus.slice(0, 20);
  }

  constructor() {
  }
}
