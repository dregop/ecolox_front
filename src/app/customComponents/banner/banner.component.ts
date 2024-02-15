import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { UserFeatures } from 'src/app/models/userFeatures';
import { Co2ByOriginByTime } from 'src/app/pages/internet/internet.component';
import { LineDataApiService } from 'src/app/pages/internet/services/line-data-api.service';
import { Product } from 'src/app/pages/shopping/shopping.component';
import { AuthService } from 'src/app/services/auth.service';
import { ShoppingApiService } from 'src/app/services/shopping.service';
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
  public dbProducts!: Product[];
  public dbInternet!: Co2ByOriginByTime[];

  constructor(private authService: AuthService, private userService: UserService, private router: Router, private shoppingApiService: ShoppingApiService, private lineDataApi: LineDataApiService) {
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

    this.lineDataApi
    .getData()
    .subscribe({
      next: (val) => {
        if (val && val.data) {
          this.dbInternet = JSON.parse(val.data);
          console.log(this.dbInternet);
          this.shoppingApiService.getProducts().subscribe({
            next: (val) => {
              if (val && val.data) {
                this.dbProducts = JSON.parse(val.data);
                console.log(val.data);
                const co2_max = document.getElementById('co2_max');
                if (co2_max && this.dbProducts.length > 0) {
                  co2_max.innerHTML = (this.dbProducts[this.dbProducts.length - 1].co2 + this.dbInternet[this.dbInternet.length - 1].co2 / 1000).toFixed(1) + ' kgCo<sub>2</sub>e';
                }
              }
            },
            error: (error) => {
              console.log(error);
          }});
        }
      }
    });

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

  public isInternet() {
    return this.router.url === '/internet';
  }

  public isAchats() {
    return this.router.url === '/shopping';
  }

  ngOnDestroy() {
  }
}
