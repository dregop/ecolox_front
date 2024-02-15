import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BannerComponent } from './customComponents/banner/banner.component';
import { MenuComponent } from './customComponents/menu/menu.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './auth.interceptor';
import { LegalMentionsComponent } from './pages/legal-mentions/legal-mentions.component';
import { ToggleButtonComponent } from './customComponents/toggle-button/toggle-button.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { OverlayMessageComponent } from './customComponents/overlay-message/overlay-message.component';
import { HouseComponent } from './pages/house/house.component';
import { RankComponent } from './pages/rank/rank.component';
import { ShoppingComponent } from './pages/shopping/shopping.component';
import { LoaderComponent } from './customComponents/loader/loader.component';
import { InternetComponent } from './pages/internet/internet.component';
import { LineChartComponent } from './pages/internet/line-chart/line-chart.component';
import { LineChartShoppingComponent } from './pages/shopping/line-chart-shopping/line-chart-shopping.component';
import { BarChartComponent } from './pages/internet/bar-chart/bar-chart.component';
import { TravelComponent } from './pages/travel/travel.component';


@NgModule({
  declarations: [
    AppComponent,
    BannerComponent,
    MenuComponent,
    LegalMentionsComponent,
    ToggleButtonComponent,
    ResetPasswordComponent,
    LineChartComponent,
    LineChartShoppingComponent,
    OverlayMessageComponent,
    InternetComponent,
    HouseComponent,
    RankComponent,
    BarChartComponent,
    ShoppingComponent,
    LoaderComponent,
    TravelComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
