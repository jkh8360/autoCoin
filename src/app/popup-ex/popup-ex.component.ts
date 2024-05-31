import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-popup-ex',
  templateUrl: './popup-ex.component.html',
  styleUrls: ['./popup-ex.component.css']
})
export class PopupExComponent implements OnInit {
  @Input() popupData: any;
  @Output() closeEvent = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }


  closePopup() {
    this.closeEvent.emit();
  }

}
