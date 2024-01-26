import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavSection,
  NavigationPayload,
} from '../../pages/dashboard/interfaces/nav-section.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NavSectionType } from '../../pages/dashboard/enums/nav-section-type.enum';
import { MatListModule } from '@angular/material/list';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatExpansionModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    ReactiveFormsModule,
  ],
  templateUrl: './nav-item.component.html',
  styleUrl: './nav-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavItemComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() section?: NavSection;
  @Input() currentUrl?: string;

  @Output() navigationEmitter = new EventEmitter<NavigationPayload>();

  activatedUrl = signal(false);

  @ViewChild('expandableSection')
  expandableSectionTemplateRef?: TemplateRef<NavSection>;
  @ViewChild('linkSection')
  linkSectionTemplateRef?: TemplateRef<NavSection>;
  @ViewChild('searchSection')
  searchSectionTemplateRef?: TemplateRef<NavSection>;

  currentTemplateRef: WritableSignal<TemplateRef<NavSection> | null> =
    signal(null);

  search?: FormControl<string>;

  isPaidUser = computed(() => this.userService.isPaidUser());
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    if (this.section?.type === NavSectionType.SEARCH) {
      this.search = new FormControl<string>(
        { value: '', disabled: !this.isPaidUser() },
        { nonNullable: true }
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['currentUrl']) return;
    this.activatedUrl.set(
      changes['currentUrl'].currentValue.includes(this.section?.uri)
    );
  }

  ngAfterViewInit(): void {
    if (
      !this.section ||
      !this.expandableSectionTemplateRef ||
      !this.linkSectionTemplateRef ||
      !this.searchSectionTemplateRef
    )
      return;

    switch (this.section.type) {
      case NavSectionType.EXPANSION_PANEL:
        this.currentTemplateRef.update(
          () => this.expandableSectionTemplateRef as TemplateRef<NavSection>
        );
        break;
      case NavSectionType.LINK:
        this.currentTemplateRef.update(
          () => this.linkSectionTemplateRef as TemplateRef<NavSection>
        );
        break;
      case NavSectionType.SEARCH:
        this.currentTemplateRef.update(
          () => this.searchSectionTemplateRef as TemplateRef<NavSection>
        );
    }
  }

  emitNavigationPayload(
    payload: NavigationPayload | ((arg: string) => NavigationPayload)
  ) {
    if (typeof payload !== 'object') {
      if (!this.search) return;
      const value = this.search.value;
      payload = payload(value);
    }

    this.navigationEmitter.emit(payload);
  }
}
