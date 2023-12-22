import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBookOpenReader,
  faChartLine,
  faHeart,
  faHome,
  faMessage,
  faQuestion,
  faThumbsUp,
  faFont,
  faEnvelope,
  faMobile,
  faCircleQuestion,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { CarouselComponent } from '../../components/carousel/carousel.component';
import { Router, RouterModule } from '@angular/router';
import { ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { doughnutChartOptions } from './constants/chart-option.const';
import {
  firstDoughnutChartData,
  fourthDoughnutChartData,
  secondDoughnutChartData,
  thirdDoughnutChartData,
} from './constants/charts-data.const';
import { EMAIL_REGEX } from '../../components/modals/auth/constants/email-regex.const';
import { PhoneBrDirective } from '../../shared/directives/phonebr.directive';
import { MatSelectModule } from '@angular/material/select';
import { FooterComponent } from '../../components/footer/footer.component';
import { LogoComponent } from '../../components/logo/logo.component';
import { ModalService } from '../../services/modal.service';
import { AuthComponent } from '../../components/modals/auth/auth.component';
import { DialogData } from '../../components/modals/auth/interface/dialog-data.interface';
import { UserService } from '../../services/user/user.service';
import { fireToast } from '../../notification/functions/fire-toast.function';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatButtonModule,
    MatSelectModule,
    FontAwesomeModule,
    NgChartsModule,
    LogoComponent,
    CarouselComponent,
    FooterComponent,
    PhoneBrDirective,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('section') sections?: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('wrapper') wrapperElementRef?: ElementRef<HTMLDivElement>;

  faFont = faFont;
  faEnvelope = faEnvelope;
  faMessage = faMessage;
  faMobile = faMobile;
  faCircleQuestion = faCircleQuestion;
  faPaperPlane = faPaperPlane;
  faBookOpenReader = faBookOpenReader;
  faChartLine = faChartLine;

  links = signal([
    {
      isActive: true,
      icon: faHome,
      label: 'Home',
      anchor: 'home',
    },
    {
      isActive: false,
      icon: faQuestion,
      label: 'Como utilizar',
      anchor: 'como-usar',
    },
    {
      isActive: false,
      icon: this.faChartLine,
      label: 'Progrida',
      anchor: 'progrida',
    },
    {
      isActive: false,
      icon: faThumbsUp,
      label: 'Social',
      anchor: 'social',
    },
    {
      isActive: false,
      icon: faHeart,
      label: 'Assinar',
      anchor: 'assinar',
    },
    {
      isActive: false,
      icon: this.faMessage,
      label: 'Contato',
      anchor: 'contato',
    },
  ]);

  parallaxImgs = [
    'assets/img/study0.jpeg',
    'assets/img/study1.jpg',
    'assets/img/study2.jpg',
    'assets/img/study3.jpg',
  ];

  carouselImgs = [
    'assets/img/screen1.png',
    'assets/img/screen2.png',
    'assets/img/screen3.png',
  ];

  currentSection = signal('home');

  private navigationHighlightEffect = effect(
    () => {
      const section = this.currentSection();

      const sectionIndex = untracked(this.links).findIndex(
        (l) => l.anchor === section
      );
      // console.log('@@@', { section, sectionIndex });

      if (sectionIndex === -1) return;
      this.navigate(sectionIndex);
    },
    { allowSignalWrites: true }
  );

  private playedGraphsAnimationEffect = effect(
    () => {
      if (this.graphsAnimationPlayed()) return;
      const section = this.currentSection();
      if (section === 'progrida') {
        this.graphsAnimationPlayed.set(true);
      }
    },
    { allowSignalWrites: true }
  );

  observer?: IntersectionObserver;

  graphsAnimationPlayed = signal(false);
  doughnutChartType: ChartType = 'doughnut';
  firstDoughnutChartData: ChartData<'doughnut'> = firstDoughnutChartData;
  secondDoughnutChartData: ChartData<'doughnut'> = secondDoughnutChartData;
  thirdDoughnutChartData: ChartData<'doughnut'> = thirdDoughnutChartData;
  fourthDoughnutChartData: ChartData<'doughnut'> = fourthDoughnutChartData;
  doughnutChartOptions: any = doughnutChartOptions;

  phoneType: 'telephone' | 'cellphone' = 'cellphone';

  form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        Validators.pattern(EMAIL_REGEX),
      ],
    }),
    phone: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.minLength(16)],
    }),
    heardAbout: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
  });

  constructor(
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private router: Router,
    private modalService: ModalService,
    public userService: UserService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.sections || !this.sections.length) return;
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.handleIntersection(entry);
            }
          });
        },
        { threshold: 0.5 }
      );

      this.sections?.forEach((el) => {
        this.observer?.observe(el.nativeElement);
      });
    });
  }

  private handleIntersection(entry: IntersectionObserverEntry) {
    // Perform actions when the observed element is in view
    const currentSection = entry.target.getAttribute('data-section');
    console.log({ currentSection });
    if (!currentSection) return;
    this.currentSection.update((current) => {
      if (current === currentSection) return current;
      return currentSection;
    });
    this.cd.detectChanges();
  }

  navigate(index: number) {
    this.links.update((links) => {
      const updatedLinks = links.map((l) => ({ ...l, isActive: false }));
      updatedLinks[index].isActive = true;
      const anchor = updatedLinks[index].anchor;
      this.router.navigate([], { fragment: anchor });
      return updatedLinks;
    });
  }

  scrollIntoView(anchor: string) {
    if (!this.wrapperElementRef || !this.sections) return;

    const elementRef = this.sections.find((s) => {
      return s.nativeElement.getAttribute('data-section') === anchor;
    });
    if (!elementRef) return;
    elementRef.nativeElement.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
    });

    // setTimeout(() => {
    //   if (!this.wrapperElementRef) return;
    //   this.wrapperElementRef.nativeElement.scrollBy({
    //     top: -63,
    //     behavior: 'smooth',
    //   });
    // }, 700);
  }

  onSubmitContactForm() {
    throw new Error('unimplemented!');
  }

  openAuth() {
    if (this.userService.isLoggedIn()) {
      fireToast('Atenção', 'você já está logado 😉', 'success');
      this.router.navigate(['painel'], { fragment: 'desempenho' });
      return;
    }
    this.modalService.openModal<AuthComponent, DialogData, void>(
      AuthComponent,
      { initialTabIndex: 1 }
    );
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.navigationHighlightEffect.destroy();
    this.playedGraphsAnimationEffect.destroy();
  }
}
