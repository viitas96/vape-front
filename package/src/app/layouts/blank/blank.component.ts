import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ThemeService } from 'src/app/services/theme.service';

import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: [],
  imports: [RouterOutlet, MaterialModule],
})
export class BlankComponent {
  private htmlElement!: HTMLHtmlElement;

  options = this.settings.getOptions();

  constructor(private settings: CoreService, public themeService: ThemeService) {
    this.htmlElement = document.querySelector('html')!;
  }


}
