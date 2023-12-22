import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'alternativeTooltip',
  standalone: true,
  pure: true,
})
export class AlternativeTooltipPipe implements PipeTransform {
  transform(
    index: number,
    answeredIndex?: number,
    correctIndex?: number
  ): string {
    if (correctIndex !== undefined && answeredIndex !== undefined) {
      if (correctIndex === index && answeredIndex === index) {
        return 'Alternativa selecionada e correta';
      } else if (correctIndex === index && answeredIndex !== index) {
        return 'Alternativa correta';
      } else if (correctIndex !== index && answeredIndex !== index) {
        return '';
      } else if (correctIndex !== index && answeredIndex === index) {
        return 'Alternativa selecionada';
      }
    }

    if (answeredIndex !== undefined) {
      return 'Alternativa selecionada';
    }

    return '';
  }
}
