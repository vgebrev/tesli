import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LessonEditorComponent } from './lesson-editor.component';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

class MatDialogRefMock {
  constructor() { }
}

describe('LessonEditorComponent', () => {
  let component: LessonEditorComponent;
  let fixture: ComponentFixture<LessonEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule
      ],
      declarations: [ LessonEditorComponent ],
      providers: [
        { provide: MatDialogRef, useValue: MatDialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: { data: { eventStart: new Date() } } }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
