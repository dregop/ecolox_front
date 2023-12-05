import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit{
  public isAuthenticated!: any;
  public currentUser!: User;
  private showIndicatorsBool: boolean = false;

  constructor(private authService: AuthService, private userService: UserService, private router: Router) {
    this.userService.$currentUser.subscribe((user) => {
      this.currentUser = user;
    });
    this.userService.$isAuthenticated.subscribe((bool) => {
      this.isAuthenticated = bool;
    });
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    this.userService.$isAuthenticated.next(this.isAuthenticated);
  }

  public logout() {
    this.authService.logout();
    this.isAuthenticated = this.authService.isLoggedIn();
    this.userService.$isAuthenticated.next(this.isAuthenticated);
    this.ngOnDestroy();
  }

  public showIndicatorsMobile() {
    const indicators = document.getElementById('banner_indicators');
    if (indicators) {
      this.showIndicatorsBool = !this.showIndicatorsBool;
      indicators.style.display = this.showIndicatorsBool ? 'flex' : 'none';
    }
  }

  ngOnDestroy() {
  }
}
