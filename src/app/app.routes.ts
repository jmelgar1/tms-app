import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Stats } from './pages/stats/stats';
import { MapPage } from './pages/map/map';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'map', component: MapPage },
  { path: 'stats', component: Stats },
];
