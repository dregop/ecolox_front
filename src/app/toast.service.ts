import { Injectable } from '@angular/core';

export enum toastType {
  Error,
  Info,
  Success
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toastMessage = '';
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
