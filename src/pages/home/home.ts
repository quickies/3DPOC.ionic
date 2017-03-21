import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  stlURL: string;

  constructor(public navCtrl: NavController) {
    // this.stlURL = 'https://cdn.thingiverse.com/assets/08/8e/d3/01/d1/TeaPot1binary.stl';
    this.stlURL = 'assets/Teapot.stl';
  }
}
