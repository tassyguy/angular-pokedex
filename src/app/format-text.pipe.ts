import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatText',
  standalone: true,
})
export class FormatTextPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    // Replace hyphens with spaces and split into words
    const words = value.replace(/-/g, ' ').split(' ');

    // Capitalize the first letter of each word
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
