import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { UserFeatures } from 'src/app/models/userFeatures';
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
  public userFeatures!: UserFeatures;

  constructor(private authService: AuthService, private userService: UserService, private router: Router) {
    this.userService.$currentUser.subscribe((user) => {
      this.currentUser = user;
    });
    this.userService.$isAuthenticated.subscribe((bool) => {
      this.isAuthenticated = bool;
    });
    this.userService.$userFeatures.subscribe((user) => {
      this.userFeatures = user;
    });
  }

  ngOnInit(): void {

    this.userService.$isAuthenticated.next(this.isAuthenticated);
  }

  public logout() {
    this.authService.logout();
    this.isAuthenticated = this.authService.isLoggedIn();
    this.userService.$isAuthenticated.next(this.isAuthenticated);
    this.ngOnDestroy();
  }

  public showAccountMenu(event: Event) {
    event.stopPropagation();
    const account_menu = document.getElementById('account_menu');
    if (account_menu) { // 150 it's when it start to be smartphones && indicators.clientWidth < 150
      account_menu.style.display = 'flex';
    }
    // close the menu
    document.addEventListener('click', () => {
      const account_menu = document.getElementById('account_menu');
      if (account_menu) {
        account_menu.style.display = 'none';
      }
    });
  }

  public displayOverLayMessage() {
    const overlay = document.getElementById('overlay_message');
    if (overlay) {
      overlay.style.display = 'block';
    }

  }

  ngOnDestroy() {
  }
}
