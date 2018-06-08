import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import {UserJourney} from "./user-journey";

@Component({
  selector: 'user-journey',
  templateUrl: './user-journey.component.html',
  styleUrls: ['./user-journey.component.scss']
})
export class UserJourneyComponent implements OnInit {
  public last = false;
  public stepIndex = 0;
  public steps: any = UserJourney;
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
    if(!this.stepIndex) return;
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


  getExtension(stepInput) {
    let fileNameAndQuery = stepInput.src.split("/").pop();
    let breakdown = fileNameAndQuery.split('?');
    let fileName = breakdown[0];
    let query = breakdown[1] || null;
    let extension = fileName.split('.').pop();
    return extension;
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
