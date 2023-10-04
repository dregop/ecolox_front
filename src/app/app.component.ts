import { Component } from '@angular/core';
import { Co2ByOriginByTime } from './main/main.component';
import {Subscription} from 'rxjs';
import {Exam} from './exams/exam.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { User } from './models/user';
import { UserService } from './user/services/user.service';

enum toastType {
  Error,
  Success
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  marketStatus!: Co2ByOriginByTime[];
  marketStatusToPlot: Co2ByOriginByTime[] = [];
  isAuthenticated!: any;
  loginForm!:FormGroup;
  signUpForm!:FormGroup;
  currentUser!: User;
  toastMessage!: string;

  set MarketStatus(status: Co2ByOriginByTime[]) {
    this.marketStatus = status;
    this.marketStatusToPlot = this.marketStatus.slice(0, 20);
  }

  constructor(private fb:FormBuilder, private authService: AuthService, private router: Router, private userService: UserService) {
    this.loginForm = this.fb.group({
      email: ['',[Validators.required]],
      password: ['',[Validators.required]]
    });

    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      login: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  
  ngOnInit() {
    this.isAuthenticated = this.authService.isLoggedIn();
    if (this.isAuthenticated) {
      this.userService.getProfile().subscribe({
        next: (val: any) => this.currentUser = new User(val.login),
        error: (err) => console.log(err.message)
      });
    }
  }

  public login() {
    const val = this.loginForm.value;

    if (this.loginForm.valid && val.email && val.password) {
        this.authService.login(val.email, val.password)
            .subscribe({
              next: (data) => {
                this.handleToast(toastType.Success, 'Content de te revoir !');
                this.signUpForm.reset();
                this.userService.getProfile().subscribe({
                  next: (val: any) => this.currentUser = new User(val.login),
                  error: (err) => console.log(err.message)
                });
                this.isAuthenticated = this.authService.isLoggedIn(); // à changer ?
              },
              error: (error) => {
                if (error) {
                  this.handleToast(toastType.Error, error.error.text);
                } else {
                  this.handleToast(toastType.Error, 'Dommage ça marche pas !');
                }
              }
            });
    }
  }

  public signUp() {
    const val = this.signUpForm.value;
    if (this.signUpForm.valid && val.email && val.password && val.login) {
        this.authService.signUp(val.email, val.login, val.password)
            .subscribe({
              next: () => {
                this.handleToast(toastType.Success, 'Bienvenue, installe toi et laisse faire l\'algorithme !');
                this.signUpForm.reset();
                this.currentUser = new User(val.login);
                this.isAuthenticated = this.authService.isLoggedIn(); // à changer ?
              },
              error: (error) => {
                if (error) {
                  this.handleToast(toastType.Error, error.error.text);
                } else {
                  this.handleToast(toastType.Error, 'Dommage ça marche pas !');
                }
              }
            });
    } else {
      this.handleToast(toastType.Error, 'Email Invalide ? Sinon minimum 3 lettres pour le pseudo et 6 pour le mot de passe');
    }
  }

  public logout() {
    this.authService.logout();
    this.isAuthenticated = this.authService.isLoggedIn();
  }

  public handleToast(type: toastType, message: string) {
    const toastDiv = document.getElementById('toast');
    if (toastDiv) {
      toastDiv.className = "show";
      this.toastMessage = message;
      toastDiv.style.backgroundColor = type === toastType.Error ? 'rgb(228, 60, 60)' : 'rgb(175, 224, 175)';
      setTimeout(function(){ toastDiv.className = toastDiv.className.replace("show", ""); }, 4000);
    }
  }

  public openAccount() {
    const sousMenu = document.getElementById('sous-menu');
    if (sousMenu) {
      sousMenu.style.animation = 'apparitionSousMenu 2s forwards';
    }
  }

  ngOnDestroy() {
  }
}
