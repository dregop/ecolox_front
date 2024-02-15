import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, throwError, catchError, Subject, async } from 'rxjs';
import { Co2ByOriginByTime } from '../internet.component';
import { API_URL } from 'src/environments/env.dev';

@Injectable({
  providedIn: 'root'
})
export class LineDataApiService {


  constructor(private http: HttpClient) { }

  private static _handleError(err: HttpErrorResponse | any) {
    return throwError(() => err.message || 'Error: Unable to complete request.');
  }

  getData(): Observable<any> {
    return this.http
      .get(`${API_URL}/line_chart_data`)
      .pipe(catchError(LineDataApiService._handleError));
  }

  saveData(data: any): Observable<any> {
    return this.http
      .post(`${API_URL}/line_chart_data`, data);
  }

  updateData(data: any): Observable<any> {
    return this.http
      .put(`${API_URL}/line_chart_data`, data);
  }

  getGlobalData(): Observable<any> {
    return this.http
      .get(`${API_URL}/line_chart_data/all`)
      .pipe(catchError(LineDataApiService._handleError));
  }
}
