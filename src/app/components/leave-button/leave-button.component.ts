import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-leave-button',
  standalone: true,
  imports: [],
  templateUrl: './leave-button.component.html',
  styleUrl: './leave-button.component.scss',
})
export class LeaveButtonComponent {
  @Output() leaveGroup: EventEmitter<any> = new EventEmitter();

  leaveGroupClick() {
    this.leaveGroup.emit();
  }
}
