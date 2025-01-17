import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousOrderSidebarComponent } from './previous-order-sidebar.component';

describe('PreviousOrderSidebarComponent', () => {
  let component: PreviousOrderSidebarComponent;
  let fixture: ComponentFixture<PreviousOrderSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousOrderSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviousOrderSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
