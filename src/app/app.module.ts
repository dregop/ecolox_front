import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BannerComponent } from './customComponents/banner/banner.component';
import { MenuComponent } from './customComponents/menu/menu.component';
import { ChartComponent } from './chart/chart.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './auth.interceptor';
import { LegalMentionsComponent } from './pages/legal-mentions/legal-mentions.component';
import { HomeComponent } from './pages/home/home.component';
import { ToggleButtonComponent } from './customComponents/toggle-button/toggle-button.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { LineChartComponent } from './chart/line-chart/line-chart.component';


@NgModule({
  declarations: [
    AppComponent,
    BannerComponent,
    MenuComponent,
    ChartComponent,
    LegalMentionsComponent,
    HomeComponent,
    ToggleButtonComponent,
    ResetPasswordComponent,
    LineChartComponent
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
