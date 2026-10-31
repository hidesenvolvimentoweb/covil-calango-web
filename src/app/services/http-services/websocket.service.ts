import { Injectable } from "@angular/core";
import * as SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";
import { take } from "rxjs/operators";

const TOPIC_SESSION = "/topic/session/*";

@Injectable({
  providedIn: "root",
})
export class WebsocketService {
  public stompClient: CompatClient;
  public simpSessionId: string;

  createWebSocketConnection(): Observable<string> {
    return new Observable<string>((observer) => {
      const socket = new SockJS(`${environment.url}/covil-ws`);
      this.stompClient = Stomp.over(socket);
      this.stompClient.connect({}, () => {
        this.stompClient.subscribe(TOPIC_SESSION, (message) => {
          this.simpSessionId = message.body;
          observer.next(this.simpSessionId);
          observer.complete();
        });
      });
    }).pipe(take(1));
  }

  getSessionId() {
    return this.simpSessionId;
  }

  disconnect(): void {
    this.simpSessionId = "";
    if (this.stompClient?.active) {
      void this.stompClient.deactivate().catch((error) => {
        console.error("Erro ao encerrar a conexão WebSocket", error);
      });
    }
  }

  getClient() {
    return this.stompClient;
  }

  send(path: string, content: any) {
    this.stompClient.send(path, {}, JSON.stringify(content));
  }
}
