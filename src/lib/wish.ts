import adapter from "webrtc-adapter";

export const DEFAULT_ICE_SERVERS = ["stun:stun.cloudflare.com:3478"];

enum Mode {
  Player = "player",
  Publisher = "publisher",
}

export interface Client {
  WithEndpoint: (endpoint: string) => void;
  Disconnect: () => Promise<void>;
  Play: (dst: MediaStream) => Promise<void>;
  Publish: (src: MediaStream) => Promise<void>;
  SetLogListener: (cb: (log: string) => void) => void;
}

export class WISH implements Client {
  private peerConnection?: RTCPeerConnection;
  private iceServers: string[] = DEFAULT_ICE_SERVERS;

  private remoteTracks: MediaStreamTrack[] = [];
  private playerMedia?: MediaStream;

  private connectedPromise?: Promise<void>;
  private connectedResolver?: (any: void) => void;
  private gatherPromise?: Promise<void>;
  private gatherResolver?: (any: void) => void;

  private endpoint?: string;
  private resourceURL?: string;
  private mode: Mode = Mode.Player;

  private logListener?: (log: string) => void;

  constructor(iceServers?: string[]) {
    if (iceServers) {
      this.iceServers = iceServers;
    }
    this.logMessage(
      `Enabling webrtc-adapter for ${adapter.browserDetails.browser}@${adapter.browserDetails.version}`
    );
  }

  private logMessage(str: string) {
    const now = new Date().toLocaleString();
    console.log(`${now}: ${str}`);
    if (this.logListener) {
      this.logListener(`${now}: ${str}`);
    }
  }

  private killConnection() {
    if (this.peerConnection) {
      this.logMessage("Closing RTCPeerConnection");
      this.peerConnection.close();
    }
  }

  private createConnection() {
    this.logMessage(
      `Creating a new RTCPeerConnection with iceServers: ${this.iceServers.join(
        ", "
      )}`
    );
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: this.iceServers,
        },
      ],
    });
    if (!this.peerConnection) {
      throw new Error("Failed to create a new RTCPeerConnection");
    }
    this.addEventListeners();
    this.newResolvers();
  }

  private newResolvers() {
    this.connectedPromise = new Promise((resolve) => {
      this.connectedResolver = resolve;
    });
    this.gatherPromise = new Promise((resolve) => {
      this.gatherResolver = resolve;
    });
  }

  private addEventListeners() {
    if (!this.peerConnection) {
      return;
    }
    this.peerConnection.addEventListener(
      "connectionstatechange",
      this.onConnectionStateChange.bind(this)
    );
    this.peerConnection.addEventListener(
      "iceconnectionstatechange",
      this.onICEConnectionStateChange.bind(this)
    );
    this.peerConnection.addEventListener(
      "icegatheringstatechange",
      this.onGatheringStateChange.bind(this)
    );
    this.peerConnection.addEventListener("track", this.onTrack.bind(this));
    this.peerConnection.addEventListener(
      "signalingstatechange",
      this.onSignalingStateChange.bind(this)
    );
  }

  private onGatheringStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `ICE Gathering State changed: ${this.peerConnection.iceGatheringState}`
    );
    switch (this.peerConnection.iceGatheringState) {
      case "complete":
        if (this.gatherResolver) {
          this.gatherResolver();
        }
        break;
    }
  }

  private onConnectionStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `Peer Connection State changed: ${this.peerConnection.connectionState}`
    );
    const transportHandler = (
      track: MediaStreamTrack,
      transport: RTCDtlsTransport
    ) => {
      const ice = transport.iceTransport;
      if (!ice) {
        return;
      }
      const pair = ice.getSelectedCandidatePair();
      if (!pair) {
        return;
      }
      if (pair.local && pair.remote) {
        this.logMessage(
          `[${track.kind}] Selected Candidate: (local ${pair.local})-(remote ${pair.remote.candidate})`
        );
      }
    };
    switch (this.peerConnection.connectionState) {
      case "connected":
        switch (this.mode) {
          case Mode.Player:
            for (const receiver of this.peerConnection.getReceivers()) {
              const transport = receiver.transport;
              if (!transport) {
                continue;
              }
              transportHandler(receiver.track, transport);
            }
            break;
          case Mode.Publisher:
            for (const sender of this.peerConnection.getSenders()) {
              const transport = sender.transport;
              if (!transport) {
                continue;
              }
              if (!sender.track) {
                continue;
              }
              transportHandler(sender.track, transport);
            }
            break;
        }
        break;
    }
  }

  private onSignalingStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `Signaling State changed: ${this.peerConnection.signalingState}`
    );
  }

  private onICEConnectionStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `ICE Connection State changed: ${this.peerConnection.iceConnectionState}`
    );
    switch (this.peerConnection.iceConnectionState) {
      case "connected":
        if (this.connectedResolver) {
          this.connectedResolver();
        }
        break;
    }
  }

  private onTrack(ev: RTCTrackEvent) {
    this.remoteTracks.push(ev.track);

    if (this.remoteTracks.length === 2) {
      for (const track of this.remoteTracks) {
        this.logMessage(`Got remote ${track.kind} track`);
        if (this.playerMedia) {
          this.playerMedia.addTrack(track);
        }
      }
    }
  }

  private async waitForICEGather() {
    setTimeout(() => {
      if (this.gatherResolver) {
        this.gatherResolver();
      }
    }, 1000);
    await this.gatherPromise;
  }

  private async doSignaling() {
    if (!this.peerConnection) {
      return;
    }
    const localOffer = await this.peerConnection.createOffer();
    // TODO: trickle
    await this.peerConnection.setLocalDescription(localOffer);
    await this.waitForICEGather();

    const offer = this.peerConnection.localDescription;
    if (!offer) {
      throw new Error("no LocalDescription");
    }
    const remoteOffer = await this.doSignalingPOST(offer.sdp);
    await this.peerConnection.setRemoteDescription({
      sdp: remoteOffer,
      type: "answer",
    });
  }

  private async whipOffer(src: MediaStream) {
    if (!this.peerConnection) {
      return;
    }
    for (const track of src.getTracks()) {
      this.logMessage(`Adding local track: ${track}`);
      this.peerConnection.addTransceiver(track, {
        direction: "sendonly",
      });
    }
    await this.doSignaling();
  }

  private async whepClientOffer() {
    if (!this.peerConnection) {
      return;
    }
    this.peerConnection.addTransceiver("video", {
      direction: "recvonly",
    });
    this.peerConnection.addTransceiver("audio", {
      direction: "recvonly",
    });
    await this.doSignaling();
  }

  private async doSignalingPOST(sdp: string): Promise<string> {
    if (!this.endpoint) {
      throw new Error("No WHIP/WHEP has been set");
    }
    const resp = await fetch(this.endpoint, {
      method: "POST",
      mode: "cors",
      body: sdp,
      headers: {
        "content-type": "application/sdp",
      },
    });
    const body = await resp.text();
    if (resp.status != 201) {
      throw new Error(`Unexpected status code ${resp.status}: ${body}`);
    }

    const resource = resp.headers.get("location");
    if (resource) {
      if (resource.startsWith("http")) {
        // absolute path
        this.resourceURL = resource;
      } else {
        // relative path
        const parsed = new URL(this.endpoint);
        parsed.pathname = resource;
        this.resourceURL = parsed.toString();
      }
      this.logMessage(`Using ${this.resourceURL} for WHIP/WHEP Resource URL`);
    } else {
      this.logMessage("No Location header in response");
    }

    return body;
  }

  private async doSignalingPATCH(frag: string) {
    if (!this.resourceURL) {
      throw new Error("No resource URL");
    }
    const resp = await fetch(this.resourceURL, {
      method: "PATCH",
      mode: "cors",
      body: frag,
      headers: {
        "content-type": "application/trickle-ice-sdpfrag",
      },
    });
    if (resp.status != 204) {
      const body = await resp.text();
      throw new Error(`Unexpected status code ${resp.status}: ${body}`);
    }
  }

  WithEndpoint(endpoint: string) {
    if (endpoint === "") {
      throw new Error("Endpoint cannot be empty");
    }
    try {
      const parsed = new URL(endpoint);
      this.logMessage(`Using ${parsed.toString()} as the WHIP/WHEP Endpoint`);
    } catch (e) {
      throw new Error("Invalid Endpoint URL");
    }
    this.endpoint = endpoint;
    this.resourceURL = "";
  }

  async Disconnect() {
    this.killConnection();
    if (!this.resourceURL) {
      throw new Error("No resource URL");
    }
    const resp = await fetch(this.resourceURL, {
      method: "DELETE",
      mode: "cors",
    });
    if (resp.status != 200) {
      const body = await resp.text();
      throw new Error(`Unexpected status code ${resp.status}: ${body}`);
    }
  }

  async Play(dst: MediaStream) {
    this.mode = Mode.Player;
    this.killConnection();
    this.playerMedia = dst;
    this.createConnection();
    await this.whepClientOffer();
    await this.connectedPromise;
  }

  async Publish(src: MediaStream) {
    this.mode = Mode.Publisher;
    this.killConnection();
    this.createConnection();
    await this.whipOffer(src);
    await this.connectedPromise;
  }

  SetLogListener(cb: (log: string) => void) {
    this.logListener = cb;
  }
}
