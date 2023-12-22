import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'letterIndexToAplhabetChar',
  standalone: true,
  pure: true,
})
export class LetterIndexToAplhabetCharPipe implements PipeTransform {
  transform(index: number | undefined): string {
    if (index === undefined) return '';
    const asciiCode = 'A'.charCodeAt(0) + index;
    return String.fromCharCode(asciiCode);
  }
}
