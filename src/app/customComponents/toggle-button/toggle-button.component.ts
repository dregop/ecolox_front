import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss']
})
export class ToggleButtonComponent implements OnInit{
  public hideMenu!: boolean;
  @Input() public buttonName: string = 'MENU';
  @Input() public classNameToToggle!: string;

  constructor()
  {
  }

  ngOnInit() {
    this.hideMenu = localStorage.getItem('hide_' + this.buttonName) === 'true' ? true : false;

    if (this.hideMenu) {
      const menuButtons = document.getElementsByClassName(this.classNameToToggle);
      for (const index in menuButtons) {
        if ((menuButtons[index] as HTMLElement).style) {
          (menuButtons[index] as HTMLElement).style.display = this.hideMenu ? 'none' : 'block';
        }

      }
    }
  }

  public toggleMenu() {
    this.hideMenu = !this.hideMenu;
    localStorage.setItem('hide_' + this.buttonName, this.hideMenu ? 'true' : 'false');
    const menuButtons = document.getElementsByClassName(this.classNameToToggle);
     for (const index in menuButtons) {
      if ((menuButtons[index] as HTMLElement).style) {
        (menuButtons[index] as HTMLElement).style.display = this.hideMenu ? 'none' : this.classNameToToggle === 'btn-menu' ? 'block' : 'inline';
      }
     }

  }
}
