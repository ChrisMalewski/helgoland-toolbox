import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { HelgolandServicesModule } from './../../../services/services.module';
import { PlatformMapSelectorComponent } from './platform-map-selector.component';
import { StationMapSelectorComponent } from './station-map-selector.component';
import { ProfileTrajectoryMapSelectorComponent } from './trajectory-map-selector.component';

const COMPONENTS = [
  PlatformMapSelectorComponent,
  StationMapSelectorComponent,
  ProfileTrajectoryMapSelectorComponent
];

@NgModule({
  imports: [
    CommonModule,
    HelgolandServicesModule
  ],
  declarations: [
    COMPONENTS
  ],
  exports: [
    COMPONENTS
  ],
  providers: [
  ]
})
export class HelgolandMapSelectorModule {
}