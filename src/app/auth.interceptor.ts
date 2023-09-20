import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>,
              next: HttpHandler): Observable<HttpEvent<any>> {

        const idToken = localStorage.getItem("id_token");

        if (idToken) {
            const cloned = req.clone({
                headers: req.headers.set("Authorization",
                    "Bearer " + idToken)
            });

            return next.handle(cloned);
        }
        else {
            return next.handle(req);
        }
    }
}
// import { Injectable } from '@angular/core';
// import {
//   HttpRequest,
//   HttpHandler,
//   HttpEvent,
//   HttpInterceptor
// } from '@angular/common/http';
// import { BehaviorSubject, Observable, catchError, mergeMap, throwError } from 'rxjs';
// import { Router } from '@angular/router';

// @Injectable()
// export class AuthInterceptor implements HttpInterceptor {

//   constructor(private router: Router, private http: HttpClient) {}

//   intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     if (!/.*\/api\/auth\/.*/.test(req.url)) {
//       return this.getAccessToken().pipe(
//         mergeMap((accessToken: string) => {
//           const reqAuth = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
//           return next.handle(reqAuth);
//         }),
//         catchError((err) => {
//           console.error(err);
//           this.router.navigate(['/login']);
//           return throwError(err);
//         })
//       );
//     } else {
//       return next.handle(req);
//     }
//   }

//   // Get access token, automatically refresh if necessary
//   getAccessToken(): Observable<string> {
//     const accessToken = localStorage.getItem('accessToken');
//     const refreshToken = localStorage.getItem('refreshToken');
//     if (!this.jwt.isTokenExpired(accessToken)) {
//       return new BehaviorSubject(accessToken);
//     } else if (!this.jwt.isTokenExpired(refreshToken)) {
//       console.log('refreshing access token');
//       const opts = {
//         headers: new HttpHeaders({
//           Authorization: 'Bearer ' + refreshToken
//         })
//       };
//       return this.http.post<RefreshResponse>(REFRESH_API, {}, opts).pipe(
//         map(response => {
//           localStorage.setItem('accessToken', response.accessToken);
//           console.log('authentication refresh successful');
//           return response.accessToken;
//         })
//       );
//     } else {
//       return throwError('refresh token is expired');
//     }
//   }
// }
