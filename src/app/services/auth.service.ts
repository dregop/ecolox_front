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
      
    login(login:string, password:string ) {
        return this.http.post<any>(API_URL + '/login', {login, password})
        .pipe(
            tap((res) => this.setSession(res)),
            shareReplay() // prevent multiple http call
          );       
    }

    private setSession(authResult: { expiresIn: any; idToken: string; }) {
        console.log('set session');
        localStorage.setItem('id_token', authResult.idToken);
        localStorage.setItem("expires_at", JSON.stringify(moment(authResult.expiresIn).valueOf()) );
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
        let expiresAt = null;
        if (expiration) {
            expiresAt = JSON.parse(expiration);
        }
        return moment(expiresAt);
    }

    signUp(login:string, password:string ) {
        return this.http.post<any>(API_URL + '/signup', {login, password})
        .pipe(
            tap((res) => this.setSession(res)),
            shareReplay() // prevent multiple http call
          );
    }
}

