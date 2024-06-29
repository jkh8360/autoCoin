import { Injectable } from '@angular/core';
import { UtilService } from './util.service';
import { BehaviorSubject } from 'rxjs';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class Login2Service {
  private loggedIn = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedIn.asObservable();

  constructor(
    private utilService: UtilService,
    private sharedService: SharedService
  ) { }

}
