import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BannerComponent } from './banner/banner.component';
import { MenuComponent } from './menu/menu.component';
import { MainComponent } from './main/main.component';
import { UserComponent } from './user/user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './auth.interceptor';
import { LegalMentionsComponent } from './legal-mentions/legal-mentions.component';
import { HomeComponent } from './home/home.component';
import { GraphLegendComponent } from './main/graph-legend/graph-legend.component';
import { ToggleButtonComponent } from './customComponents/toggle-button/toggle-button.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';


@NgModule({
  declarations: [
    AppComponent,
    BannerComponent,
    MenuComponent,
    MainComponent,
    UserComponent,
    LegalMentionsComponent,
    HomeComponent,
    GraphLegendComponent,
    ToggleButtonComponent,
    ResetPasswordComponent
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
