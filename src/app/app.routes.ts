import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { MapPage } from './pages/map/map';
import { Stats } from './pages/stats/stats';
import { Donate } from './pages/donate/donate';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'map', component: MapPage },
  { path: 'stats', component: Stats },
  { path: 'donate', component: Donate },
];
