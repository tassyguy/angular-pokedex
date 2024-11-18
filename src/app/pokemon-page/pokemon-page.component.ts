import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PokemonClient,
  Pokemon,
  PokemonSpecies,
  ChainLink,
  FlavorText,
} from 'pokenode-ts';
import { FormatTextPipe } from '../format-text.pipe';

interface EvolutionInfo {
  species: string;
  evolutionDetails: string;
}

interface PokedexEntry {
  version: string;
  description: string;
}

@Component({
  selector: 'app-pokemon-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatTextPipe],
  templateUrl: './pokemon-page.component.html',
  styleUrls: ['./pokemon-page.component.css'],
})
export class PokemonPageComponent implements OnInit {
  pokemonList: string[] = [];
  selectedPokemon: string = '';
  pokemonDetails: Pokemon | null = null;
  pokemonSpecies: PokemonSpecies | null = null;
  evolutionChain: EvolutionInfo[] = [];
  pokedexEntries: PokedexEntry[] = [];
  availableGames: string[] = [];

  private api: PokemonClient;
  private formatTextPipe: FormatTextPipe;

  constructor() {
    this.api = new PokemonClient();
    this.formatTextPipe = new FormatTextPipe();
  }

  ngOnInit() {
    this.loadPokemonList();
  }

  async loadPokemonList() {
    try {
      const response = await this.api.listPokemons(0, 1000);
      this.pokemonList = response.results.map((pokemon) => pokemon.name);
    } catch (error) {
      console.error('Error loading Pokemon list:', error);
    }
  }

  async onPokemonSelect() {
    if (this.selectedPokemon) {
      try {
        this.pokemonDetails = await this.api.getPokemonByName(
          this.selectedPokemon
        );
        this.pokemonSpecies = await this.api.getPokemonSpeciesByName(
          this.selectedPokemon
        );
        await this.fetchEvolutionChain();
        this.extractPokedexEntries();
        this.loadAvailableGames();
      } catch (error) {
        console.error('Error fetching Pokemon details:', error);
      }
    }
  }

  loadAvailableGames() {
    if (!this.pokemonDetails) return;

    this.availableGames = this.pokemonDetails.game_indices
      .map((gi) => this.formatTextPipe.transform(gi.version.name))
      .sort();
  }

  async fetchEvolutionChain() {
    if (this.pokemonSpecies && this.pokemonSpecies.evolution_chain) {
      const evolutionChainUrl = this.pokemonSpecies.evolution_chain.url;
      try {
        const response = await fetch(evolutionChainUrl);
        const evolutionChainData = await response.json();
        this.evolutionChain = this.extractEvolutions(evolutionChainData.chain);
      } catch (error) {
        console.error('Error fetching evolution chain:', error);
      }
    }
  }

  private extractEvolutions(chain: ChainLink): EvolutionInfo[] {
    const evolutions: EvolutionInfo[] = [];

    const extractEvolutionDetails = (details: any[]): string => {
      if (details.length === 0) return 'Base form';
      const detail = details[0];
      if (detail.min_level) return `Level ${detail.min_level}`;
      if (detail.item)
        return `Use ${this.formatTextPipe.transform(detail.item.name)}`;
      if (detail.trigger && detail.trigger.name === 'trade') return 'Trade';
      if (detail.held_item)
        return `Hold ${this.formatTextPipe.transform(detail.held_item.name)}`;
      if (detail.known_move)
        return `Know ${this.formatTextPipe.transform(detail.known_move.name)}`;
      if (detail.min_happiness) return `Happiness ≥ ${detail.min_happiness}`;
      if (detail.time_of_day) return `During ${detail.time_of_day}`;
      return 'Special condition';
    };

    const traverse = (node: ChainLink) => {
      evolutions.push({
        species: node.species.name,
        evolutionDetails: extractEvolutionDetails(node.evolution_details),
      });
      node.evolves_to.forEach(traverse);
    };

    traverse(chain);
    return evolutions;
  }

  private extractPokedexEntries() {
    if (this.pokemonSpecies) {
      this.pokedexEntries = this.pokemonSpecies.flavor_text_entries
        .filter((entry: FlavorText) => entry.language.name === 'en')
        .map((entry: FlavorText) => ({
          version: this.formatTextPipe.transform(
            (entry as any).version?.name || 'Unknown'
          ),
          description: entry.flavor_text.replace(/\f/g, ' '),
        }));
    }
  }
}
