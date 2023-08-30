import * as moment from "moment";
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { shareReplay, tap } from 'rxjs';
import { API_URL } from "../env";

@Injectable()
export class AuthService {
     
    constructor(private http: HttpClient) {
    }
      
    login(email:string, password:string ) {
        return this.http.post<User>(API_URL + '/login', {email, password})
        .pipe(
            tap(event => this.setSession),
            shareReplay() // prevent multiple http call
          );
    }

    private setSession(authResult: { expiresIn: any; idToken: string; }) {
        const expiresAt = moment().add(authResult.expiresIn,'second');

        localStorage.setItem('id_token', authResult.idToken);
        localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()) );
    }          

    logout() {
        localStorage.removeItem("id_token");
        localStorage.removeItem("expires_at");
    }

    public isLoggedIn() {
        return moment().isBefore(this.getExpiration());
    }

    isLoggedOut() {
        return !this.isLoggedIn();
    }

    getExpiration() {
        const expiration = localStorage.getItem("expires_at");
        const expiresAt = null;
        if (expiration) {
            const expiresAt = JSON.parse(expiration);
        }

        return moment(expiresAt);
    }

    signUp(login:string, password:string ) {
        return this.http.post<User>(API_URL + '/signup', {login, password})
        .pipe(
            tap(event => this.setSession),
            shareReplay() // prevent multiple http call
          );
    }
}
