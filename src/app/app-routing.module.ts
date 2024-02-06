import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LegalMentionsComponent } from './pages/legal-mentions/legal-mentions.component';
import { HomeComponent } from './pages/home/home.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ShoppingComponent } from './pages/shopping/shopping.component';

const routes: Routes = [
  { path: '', redirectTo: '/accueil', pathMatch: 'full' },
  { path: 'accueil', component: HomeComponent},
  { path: 'shopping', component: ShoppingComponent},
  { path: 'mentions-legales', component: LegalMentionsComponent},
  { path: 'mot-de-passe-oublie/:token', component: ResetPasswordComponent},
  { path: '**', redirectTo: '/accueil'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
