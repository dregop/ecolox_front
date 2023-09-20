import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'callback',
  template: `
    <div>Loading authentication details...</div>
  `,
})
export class CallbackComponent implements OnInit {
  constructor(private router: Router, public auth: AuthService) { }

  ngOnInit(): void {
    const self = this;
    this.auth.handleRedirectCallback();
  }
}