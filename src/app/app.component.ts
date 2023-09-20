import { Component } from '@angular/core';
import { Co2ByOriginByTime } from './main/main.component';
import {Subscription} from 'rxjs';
import {Exam} from './exams/exam.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { User } from './models/user';
import { UserService } from './user/services/user.service';

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

  set MarketStatus(status: Co2ByOriginByTime[]) {
    this.marketStatus = status;
    this.marketStatusToPlot = this.marketStatus.slice(0, 20);
  }

  constructor(private fb:FormBuilder, private authService: AuthService, private router: Router, private userService: UserService) {
    this.loginForm = this.fb.group({
      login: ['',Validators.required],
      password: ['',Validators.required]
    });

    this.signUpForm = this.fb.group({
      login: ['',Validators.required],
      password: ['',Validators.required],
      repeat_password: ['',Validators.required]
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

    if (val.login && val.password) {
        this.authService.login(val.login, val.password)
            .subscribe(
                () => {
                    console.log("User is logged in");
                    this.currentUser = new User(val.login);
                    this.isAuthenticated = this.authService.isLoggedIn(); // à changer ?
                }
            );
    }
  }

  public signUp() {
    const val = this.signUpForm.value;
    console.log(val);
    if (val.login && val.password && val.repeat_password && val.password === val.repeat_password) {
        this.authService.signUp(val.login, val.password)
            .subscribe(
                () => {
                    console.log("User is signed up");
                    this.currentUser = new User(val.login);
                    this.isAuthenticated = this.authService.isLoggedIn(); // à changer ?
                }
            );
    }
  }

  public logout() {
    this.authService.logout();
    this.isAuthenticated = this.authService.isLoggedIn();
  }

  ngOnDestroy() {
  }
}
