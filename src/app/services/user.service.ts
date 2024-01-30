import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, shareReplay, throwError } from 'rxjs';
import { API_URL } from 'src/environments/env.dev';
import { User } from 'src/app/models/user';
import { AuthService } from './auth.service';
import { UserFeatures } from '../models/userFeatures';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public $currentUser!: BehaviorSubject<User>;
  public $userFeatures!: BehaviorSubject<UserFeatures>;
  public $isAuthenticated!: BehaviorSubject<any>;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.$currentUser = new BehaviorSubject(new User('')); //TODO: default value to change ?
    this.$isAuthenticated = new BehaviorSubject(this.authService.isLoggedIn());
    this.$userFeatures = new BehaviorSubject(new UserFeatures());
    this.getFeatures().subscribe({
      next: (features) => {
        console.log(features);
        if (features && features.level) {
          this.$userFeatures.next(features);
        }
      },
      error: (err) => console.log(err.message)
    });
  }

  private static _handleError(err: HttpErrorResponse | any) {
    return throwError(() => err.message || 'Error: Unable to complete request.');
  }

  getProfile() {
    return this.http.get<User>(API_URL + '/get_profile')
    .pipe(
        shareReplay() // prevent multiple http call
      );
  }

  getFeatures(): Observable<any> {
    return this.http
      .get(`${API_URL}/features`)
      .pipe(catchError(UserService._handleError));
  }

  saveFeatures(features: UserFeatures): Observable<any> {
    return this.http
      .post(`${API_URL}/features`, features);
  }

  updateFeatures(features: UserFeatures): Observable<any> {
    return this.http
      .put(`${API_URL}/features`, features);
  }

}
