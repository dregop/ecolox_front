import { AfterContentInit, Component, OnInit } from '@angular/core';
import {Subscription} from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Co2ByOriginByTime } from '../main/main.component';
import { User } from '../models/user';
import { AuthService } from '../services/auth.service';
import { UserService } from '../user/services/user.service';

enum toastType {
  Error,
  Success
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterContentInit {
  title = 'app';
  marketStatus!: Co2ByOriginByTime[];
  marketStatusToPlot: Co2ByOriginByTime[] = [];
  isAuthenticated!: any;
  loginForm!:FormGroup;
  signUpForm!:FormGroup;
  currentUser!: User;
  toastMessage!: string;
  showIndicatorsBool: boolean = false;
  public getStorageDisplayFirstMessage = false;
  public extensionDisplayed!: boolean;

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
  ngAfterContentInit(): void {
    this.displayFirstMessage();
  }
  
  ngOnInit() {
    this.isAuthenticated = this.authService.isLoggedIn();
    if (this.isAuthenticated) {
      this.userService.getProfile().subscribe({
        next: (val: any) => this.currentUser = new User(val.login),
        error: (err) => console.log(err.message)
      });
    }

    this.authService.test().subscribe({
      next: () => console.log('test successed'),
      error: () => console.log('test failed')
    })
  }

  public isExtensionMessageDisplayed(bool: boolean) {
    this.extensionDisplayed = bool;
  }

  private displayFirstMessage() {
    setTimeout(() => { // TODO de la merde
      console.log(this.extensionDisplayed);
      const message_extension = document.getElementById('install_extension_message');
      const co2 = document.getElementById('co2_max');
      if (!message_extension && !this.extensionDisplayed && co2)
      {
        this.getStorageDisplayFirstMessage = localStorage.getItem('first_message_display') === 'false' ? false : true;
      }
    }, 2500);
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
                  next: (val: any) => {
                    this.currentUser = new User(val.login);
                    this.displayFirstMessage();
                  },
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
                this.displayFirstMessage();
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
    this.ngOnDestroy();
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

  public showIndicatorsMobile() {
    const indicators = document.getElementById('banner_indicators');
    if (indicators) {
      this.showIndicatorsBool = !this.showIndicatorsBool;
      indicators.style.display = this.showIndicatorsBool ? 'flex' : 'none';
    }
  }

  public closeMessageOverlay(): void {
    const dont_show = document.getElementById('dont_show');
    if (dont_show && (dont_show as HTMLInputElement).checked) {
      localStorage.setItem('first_message_display', 'false');
    }
    const message = document.getElementById('first_message');
    const overlay = document.getElementById('message_overlay');
    if (message && overlay)
    {
      message.style.display = 'none';
      overlay.style.display = 'none';
    }
  }

  ngOnDestroy() {
  }
}
