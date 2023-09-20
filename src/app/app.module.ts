import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BannerComponent } from './banner/banner.component';
import { MenuComponent } from './menu/menu.component';
import { MainComponent } from './main/main.component';
import { ExamsApiService } from './exams/exams-api.service';
import {ExamFormComponent} from './exams/exam-form.component';
import {ExamsComponent} from './exams/exams.component';
import {RouterModule, Routes} from '@angular/router';
import { AuthModule } from '@auth0/auth0-angular';
import { UserComponent } from './user/user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './auth.interceptor';

const appRoutes: Routes = [
  { path: 'new-exam', component: ExamFormComponent },
  { path: '', component: ExamsComponent },
];


@NgModule({
  declarations: [
    AppComponent,
    BannerComponent,
    MenuComponent,
    MainComponent,
    ExamFormComponent,
    ExamsComponent,
    UserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule.forRoot(
      appRoutes,
    ),
    AuthModule.forRoot({
      domain: 'dev-mjyhd3u2lf0cmzir.eu.auth0.com',
      clientId: 'tNTicXeutIy4fbVUwtZZiSCSbNfKEqiu',
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    }),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ExamsApiService, AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
