import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountNumberPopUpComponent } from './account-number-pop-up.component';

describe('AccountNumberPopUpComponent', () => {
  let component: AccountNumberPopUpComponent;
  let fixture: ComponentFixture<AccountNumberPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountNumberPopUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountNumberPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
