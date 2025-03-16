import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoStreamComponent } from './components/video-stream/video-stream.component';

@Component({
  selector: 'app-root',
  standalone: true,  // ✅ Standalone component
  imports: [CommonModule, FormsModule, VideoStreamComponent],  // ✅ Import required modules
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  messages: string[] = [];  // ✅ Ensure "messages" exists
  chatMessage: string = '';  // ✅ Ensure "chatMessage" exists

  sendMessage() {
    if (this.chatMessage.trim()) {
      this.messages.push(this.chatMessage);
      this.chatMessage = '';  // Clear input after sending
    }
  }
}
