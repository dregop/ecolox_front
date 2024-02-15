import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_URL } from 'src/environments/env.dev';

@Injectable({
  providedIn: 'root'
})
export class ShoppingApiService {
  constructor(private http: HttpClient) { }

  private static _handleError(err: HttpErrorResponse | any) {
    return throwError(() => err.message || 'Error: Unable to complete request.');
  }

  getProduct(): Observable<any> {
    return this.http
      .get(`${API_URL}/food`);
  }

  saveProduct(product: any): Observable<any> {
    return this.http
      .post(`${API_URL}/food`, product);
  }

  updateProduct(product: any): Observable<any> {
    return this.http
      .put(`${API_URL}/food`, product);
  }

  getProducts(): Observable<any> {
    return this.http
      .get(`${API_URL}/food/all`);
  }
}
