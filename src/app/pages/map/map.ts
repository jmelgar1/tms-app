import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-map',
  imports: [RouterLink],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class MapPage {
  bluemapUrl: SafeResourceUrl;
  bluemapRawUrl = environment.bluemapUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.bluemapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.bluemapUrl);
  }
}
