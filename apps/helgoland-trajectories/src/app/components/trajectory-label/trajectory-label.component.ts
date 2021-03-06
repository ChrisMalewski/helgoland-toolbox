import { Component, Input } from '@angular/core';
import { HelgolandTrajectory } from '@helgoland/core';

@Component({
  selector: 'helgoland-trajectories-label',
  templateUrl: './trajectory-label.component.html',
  styleUrls: ['./trajectory-label.component.scss']
})
export class TrajectoryLabelComponent {

  @Input() trajectory: HelgolandTrajectory;

}
