import { Pipe, PipeTransform } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faA,
  faB,
  faC,
  faD,
  faE,
  faF,
  faG,
  faH,
  faI,
  faJ,
  faK,
  faL,
  faM,
  faN,
  faO,
  faP,
  faQ,
  faR,
  faS,
  faT,
  faU,
  faV,
  faW,
  faX,
  faY,
  faZ,
} from '@fortawesome/free-solid-svg-icons';

@Pipe({
  name: 'letterIndexToAplhabetIcon',
  standalone: true,
  pure: false,
})
export class IndexToAplhabetCharPipe implements PipeTransform {
  private icons = [
    faA,
    faB,
    faC,
    faD,
    faE,
    faF,
    faG,
    faH,
    faI,
    faJ,
    faK,
    faL,
    faM,
    faN,
    faO,
    faP,
    faQ,
    faR,
    faS,
    faT,
    faU,
    faV,
    faW,
    faX,
    faY,
    faZ,
  ];
  transform(index: number): IconDefinition {
    return this.icons[index] || this.icons[0];
  }
}
