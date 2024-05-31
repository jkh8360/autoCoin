import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupExComponent } from './popup-ex.component';

describe('PopupExComponent', () => {
  let component: PopupExComponent;
  let fixture: ComponentFixture<PopupExComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PopupExComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupExComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
