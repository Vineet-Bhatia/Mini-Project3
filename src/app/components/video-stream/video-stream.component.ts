import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { SignalingService } from '../../services/signaling.service';

@Component({
  selector: 'app-video-stream',
  templateUrl: './video-stream.component.html',
  styleUrls: ['./video-stream.component.scss']
})
export class VideoStreamComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;

  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;

  constructor(private signalingService: SignalingService) {}

  ngOnInit() {
    this.signalingService.getMessages().subscribe(msg => {
      if (msg.type === 'offer') {
        this.handleOffer(msg.offer);
      } else if (msg.type === 'answer') {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.answer));
      } else if (msg.type === 'candidate') {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } else if (msg.type === 'user-left') {
        this.handleUserLeft();
      }
    });
  }

  async startCall() {
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localVideo.nativeElement.srcObject = this.localStream;

    this.peerConnection = new RTCPeerConnection();
    this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.signalingService.sendMessage({ type: 'candidate', candidate: event.candidate });
      }
    };

    this.peerConnection.ontrack = event => {
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalingService.sendMessage({ type: 'offer', offer });
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    this.peerConnection = new RTCPeerConnection();

    this.peerConnection.ontrack = event => {
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localVideo.nativeElement.srcObject = this.localStream;

    this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.signalingService.sendMessage({ type: 'answer', answer });
  }

  private handleUserLeft() {
    console.log("User has left the call");

    if (this.remoteVideo.nativeElement.srcObject) {
      let remoteStream = this.remoteVideo.nativeElement.srcObject as MediaStream;
      remoteStream.getTracks().forEach(track => track.stop());
      this.remoteVideo.nativeElement.srcObject = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = new RTCPeerConnection();
    }
  }

  ngOnDestroy() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }
}
