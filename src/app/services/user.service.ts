import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, shareReplay } from 'rxjs';
import { API_URL } from 'src/environments/env.dev';
import { User } from 'src/app/models/user';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public $currentUser!: BehaviorSubject<User>;
  private currentUser!: User;
  public $isAuthenticated!: BehaviorSubject<any>;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.$currentUser = new BehaviorSubject(new User('')); //TODO: default value to change ?
    this.$currentUser.subscribe((user) => {
      this.currentUser = user;
    })
    this.$isAuthenticated = new BehaviorSubject(this.authService.isLoggedIn());
  }

  getProfile() {
    return this.http.get<User>(API_URL + '/get_profile')
    .pipe(
        shareReplay() // prevent multiple http call
      );
  }


}
