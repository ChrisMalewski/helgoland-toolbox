import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HelgolandCoreModule } from '@helgoland/core';

import { TimeListSelectorComponent } from './time-list-selector.component';

describe('TimeListSelectorComponent', () => {
  let component: TimeListSelectorComponent;
  let fixture: ComponentFixture<TimeListSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TimeListSelectorComponent],
      imports: [HelgolandCoreModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeListSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
