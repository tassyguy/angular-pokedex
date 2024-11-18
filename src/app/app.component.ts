import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonPageComponent } from './pokemon-page/pokemon-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PokemonPageComponent],
  template: '<app-pokemon-page></app-pokemon-page>',
})
export class AppComponent {
  title = 'angular-pokedex';
}
