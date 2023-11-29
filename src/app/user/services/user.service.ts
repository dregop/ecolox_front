import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { shareReplay } from 'rxjs';
import { API_URL } from 'src/environments/env.dev';
import { User } from 'src/app/models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getProfile() {
    return this.http.get<User>(API_URL + '/get_profile')
    .pipe(
        shareReplay() // prevent multiple http call
      );
  }
}
