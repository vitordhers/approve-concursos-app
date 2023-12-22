import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarouselComponent implements OnInit {
  @Input() images: string[] = [];
  currentIndex = signal(0);

  ngOnInit() {
    setInterval(() => this.showNextImage(), 5000); // Change image every 3 seconds
  }

  showNextImage() {
    this.currentIndex.update(
      (currentIndex) => (currentIndex + 1) % this.images.length
    );
  }
}
