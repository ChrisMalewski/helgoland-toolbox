import { ColorPickerModule } from 'ngx-color-picker';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';

import { TranslateTestingModule } from '../../../../../../libs/testing/translate.testing.module';
import { ModalEditTimeseriesOptionsComponent } from './modal-edit-timeseries-options.component';

describe('ModalEditTimeseriesOptionsComponent', () => {
  let component: ModalEditTimeseriesOptionsComponent;
  let fixture: ComponentFixture<ModalEditTimeseriesOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalEditTimeseriesOptionsComponent],
      imports: [
        TranslateTestingModule,
        HttpClientModule,
        MatSliderModule,
        MatSlideToggleModule,
        FormsModule,
        ColorPickerModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalEditTimeseriesOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
