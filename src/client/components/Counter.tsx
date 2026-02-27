import { Component } from "react";
import PartySocket from "partysocket";

type CounterState = {
  count?: number;
};

export async function loadInitialCount(host: string) {
  const initialCount = await PartySocket.fetch(
    {
      host,
      party: "counter",
      room: "index",
    },
    {
      method: "GET",
    }
  ).then((res) => res.text());
  return parseInt(initialCount, 10) || 0;
}

export default class Counter extends Component<Record<string, never>, CounterState> {
  private socket?: PartySocket = undefined;

  public constructor(props: Record<string, never>) {
    super(props);
    this.state = { count: undefined };
  }

  public componentDidMount(): void {
    this.socket = new PartySocket({
      host: window.location.host,
      room: "example-room",
    });

    this.socket.addEventListener("message", (event: MessageEvent) => {
      this.setState({ count: parseInt(event.data as string, 10) });
    });
  }

  public componentWillUnmount(): void {
    this.socket?.close();
    this.socket = undefined;
  }

  private increment = (): void => {
    this.setState((previousState) => ({ count: previousState.count ?? 1 }));
    this.socket?.send("increment");
  };

  public render() {
    const { count } = this.state;

    const styles = {
      backgroundColor: "#ff0f0f",
      borderRadius: "9999px",
      border: "none",
      color: "white",
      fontSize: "0.95rem",
      cursor: "pointer",
      padding: "1rem 3rem",
      margin: "1rem 0rem",
    };

    return (
      <button style={styles} onClick={this.increment}>
        Increment me! {count !== undefined && <>Count: {count}</>}
      </button>
    );
  }
}
