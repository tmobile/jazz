import {Component, Input, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {UserJourneyOss} from './user-journey.oss';
import {UserJourneyInternal} from './user-journey.internal';
import {NavigationEnd, Router} from '@angular/router';
import {LoginComponent} from '../../pages/login/oss/login.component';
import index from '@angular/cli/lib/cli';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'user-journey',
  templateUrl: './user-journey.component.html',
  styleUrls: ['./user-journey.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserJourneyComponent implements OnInit {
  public last = false;
  public stepIndex = 0;
  public steps: any = environment.envName === 'oss' ? UserJourneyOss : UserJourneyInternal;
  public currentStep;
  public bitbucketStep = 7;
  public loaded = false;

  constructor(private router: Router) {
  }

  ngOnInit() {
  }

  nextStep() {
    if (this.last) return this.endUserJourney();
    this.setStep(this.stepIndex + 1);
  }

  previousStep() {
    this.setStep(this.stepIndex - 1);
  }

  setStep(index) {
    let previousIndex = this.stepIndex;
    this.stepIndex = index;
    this.currentStep = this.steps[this.stepIndex];
    this.last = (index === this.steps.length - 1);
    let playingVideo: any = document.getElementById('user-journey-video-' + this.stepIndex);
    if(playingVideo) {
      playingVideo.currentTime = 0;
      playingVideo.load();
      setTimeout(() => {
        if(this.stepIndex === index) playingVideo.play();
      }, 500);
    }
    let stoppedVideo: any = document.getElementById('user-journey-video-' + previousIndex);
    if (stoppedVideo) {
      stoppedVideo.pause();
    }
  }

  endUserJourney() {
    this.router.navigate(['/landing']);
  }

  loadImage(imageIndex) {
    if (imageIndex === 0) {
      this.loaded = true;
    }
  }

  getPosition(index) {
    var position = index - this.stepIndex;

    if (index < this.bitbucketStep && this.stepIndex >= this.bitbucketStep) {
      position += 1;
    }

    var percent = (100 * position) + '%';
    return percent;
  }

}
