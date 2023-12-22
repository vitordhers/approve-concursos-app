import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'codeToColorClass',
  standalone: true,
  pure: true,
})
export class CodeToColorClassPipe implements PipeTransform {
  transform(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = (hash << 5) - hash + code.charCodeAt(i);
    }

    hash = hash & 0x7fffffff;

    const randomNumber = hash % 6;

    switch (randomNumber) {
      case 0:
        return 'yellow';
      case 1:
        return 'green';
      case 2:
        return 'purple';
      case 3:
        return 'red';
      case 4:
        return 'blue';
      case 5:
        return 'flamingo';
      default:
        return 'yellow';
    }
  }
}
