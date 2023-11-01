import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public hideMenu!: boolean;

  constructor()
  {
  }

  async ngOnInit() {
    this.hideMenu = await localStorage.getItem('hide_menu') === 'true' ? true : false;

    if (this.hideMenu) {
      const menuButtons = document.getElementsByClassName('btn-menu');
      for (const index in menuButtons) {
        if ((menuButtons[index] as HTMLElement).style) {
          (menuButtons[index] as HTMLElement).style.display = this.hideMenu ? 'none' : 'block';
        }

      }
    }
  }

  public toogleMenu() {
    this.hideMenu = !this.hideMenu;
    localStorage.setItem('hide_menu', this.hideMenu ? 'true' : 'false');
    const menuButtons = document.getElementsByClassName('btn-menu');
     for (const index in menuButtons) {
      if ((menuButtons[index] as HTMLElement).style) {
        (menuButtons[index] as HTMLElement).style.display = this.hideMenu ? 'none' : 'block';
      }
     }

  }
}
