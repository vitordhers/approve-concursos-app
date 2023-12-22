import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objLog',
  standalone: true,
  pure: true,
})
export class ObjectLogPipe implements PipeTransform {
  transform(object: Object): string {
    console.log('@@@ OBJECT PIPE', object);
    return object.toString();
  }
}
