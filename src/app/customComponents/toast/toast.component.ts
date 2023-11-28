import { Component } from '@angular/core';

export enum toastType {
  Error,
  Info,
  Success
}

@Component({
  selector: 'toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  public toastMessage = '';
  public toastMessageContent: any = {
    toastWelcome : "Content de te revoir !",    
    toastError : "Dommage ça marche pas !",
    toastFirstWelcome : "Bienvenue, installe toi et laisse faire l\'algorithme !",
    toastIncorrectWorld : "Email Invalide ? Sinon minimum 3 lettres pour le pseudo et 6 pour le mot de passe",
    toastEmailSent : "Email envoyé à l\'adresse email saisie",
    toastInvalidEmail : "Email Invalide",
    toastNoDataToday : "Pas de donnée enregistrée disponible pour aujourd\'hui",
  };

  constructor() {}
 
  public handleToast(type: toastType, message: string) {
      const toastDiv = document.getElementById('toast');
      if (toastDiv) {
        toastDiv.className = "show";
        this.toastMessage = message;
        switch(type) {
          case toastType.Error:
            toastDiv.style.backgroundColor = 'rgb(228, 60, 60)';
            break;
          case toastType.Success:
            toastDiv.style.backgroundColor = 'rgb(175, 224, 175)';
            break;
          case toastType.Info:
            toastDiv.style.backgroundColor = 'rgb(64, 128, 207)';
            break;
        }
        setTimeout(function(){ toastDiv.className = toastDiv.className.replace("show", ""); }, 4000);
      }
    }

}
