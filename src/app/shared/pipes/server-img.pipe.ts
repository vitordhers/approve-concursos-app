import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'serverImg',
  standalone: true,
  pure: true,
})
export class ServerImgPipe implements PipeTransform {
  transform(value: string): string {
    const firstLetters = value.substring(0, 7);

    if (firstLetters !== 'uploads') return value;

    return `${environment.serverUrl}/${value}`;
  }
}
