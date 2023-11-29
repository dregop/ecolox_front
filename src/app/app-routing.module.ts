import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LegalMentionsComponent } from './legal-mentions/legal-mentions.component';
import { HomeComponent } from './home/home.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  { path: '', redirectTo: '/accueil', pathMatch: 'full' },
  { path: 'accueil', component: HomeComponent},
  { path: 'mentions-legales', component: LegalMentionsComponent},
  { path: 'mot-de-passe-oublie/:token', component: ResetPasswordComponent},
  { path: '**', redirectTo: '/accueil'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
