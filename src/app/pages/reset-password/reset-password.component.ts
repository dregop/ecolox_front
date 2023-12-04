import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService, toastType } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  public resetPwdForm!:FormGroup;
  private token!: any;
  
  constructor(private fb:FormBuilder, private authService: AuthService, private userService: UserService, public toastService: ToastService, private route: ActivatedRoute) {
    this.resetPwdForm = this.fb.group({
      password: ['',[Validators.required]],
      password2: ['',[Validators.required]]
    });
  }

  public resetPassword(): void {
    const val = this.resetPwdForm.value;
    this.route
    .paramMap
    .subscribe((params: ParamMap) => {this.token  = params.get('token')});
    if (this.resetPwdForm.valid && val.password && val.password2 && val.password === val.password2 && this.token) {
      this.authService.resetPassword(val.password, this.token)
      .subscribe({
        next: (data) => {
          this.toastService.handleToast(toastType.Success, 'Le mot de passe a été modifié avec succès');
        },
        error: (error) => {
          if (error.error) {
            this.toastService.handleToast(toastType.Error, error.error.text);
          } else {
            this.toastService.handleToast(toastType.Error, 'Dommage ça marche pas !');
          }
        }
      });
    } else {
      if (!this.token) {
        this.toastService.handleToast(toastType.Error, 'Le token venant de l\'email est manquant !');
      } else if (val.password !== val.password2) {
        this.toastService.handleToast(toastType.Error, 'Les deux mots de passe ne sont pas identiques');
      } else {
        this.toastService.handleToast(toastType.Error, 'Saisissez un mot de passe de minimum 6 lettres/chiffres');        
      }
    }
  }

}
