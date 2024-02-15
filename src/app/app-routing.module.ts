import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LegalMentionsComponent } from './pages/legal-mentions/legal-mentions.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ShoppingComponent } from './pages/shopping/shopping.component';
import { InternetComponent } from './pages/internet/internet.component';
import { TravelComponent } from './pages/travel/travel.component';

const routes: Routes = [
  { path: '', redirectTo: '/internet', pathMatch: 'full' },
  { path: 'internet', component: InternetComponent},
  { path: 'achats', component: ShoppingComponent},
  { path: 'deplacement', component: TravelComponent},
  { path: 'mentions-legales', component: LegalMentionsComponent},
  { path: 'mot-de-passe-oublie/:token', component: ResetPasswordComponent},
  { path: '**', redirectTo: '/internet'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
