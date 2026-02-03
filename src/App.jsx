import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const App = () => {
  const [showFriend, setShowFriend] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [peerCount, setPeerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [unlockProgress, setUnlockProgress] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [flashImage, setFlashImage] = useState(null);
  const awarenessRef = useRef(null);
  const localIdRef = useRef(null);
  const localColorRef = useRef(null);

  useEffect(() => {
    let step = false;
    let idleTimer;
    let walkTimer;

    const stopWalking = () => {
      clearInterval(walkTimer);
      walkTimer = null;
      document.body.classList.remove("cursor-step-b");
      step = false;
    };

    const startWalking = () => {
      if (walkTimer) {
        return;
      }
      walkTimer = setInterval(() => {
        step = !step;
        document.body.classList.toggle("cursor-step-b", step);
      }, 120);
    };

    const onMove = () => {
      startWalking();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(stopWalking, 200);
    };

    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(idleTimer);
      clearInterval(walkTimer);
    };
  }, []);

  useEffect(() => {
    const password = "urkel grue";

    const onKeyDown = (event) => {
      if (isUnlocked) {
        return;
      }
      if (event.key === "Backspace") {
        setUnlockProgress((prev) => prev.slice(0, -1));
        return;
      }
      if (event.key.length !== 1) {
        return;
      }
      setUnlockProgress((prev) => {
        const next = (prev + event.key).slice(0, password.length);
        if (next.toLowerCase() === password) {
          setIsUnlocked(true);
        }
        return next;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }
    const triggers = ["i am otto", "i am beanius"];
    let buffer = "";
    let flashTimer = null;

    const onKeyDown = (event) => {
      if (event.key.length !== 1) {
        return;
      }
      buffer = (buffer + event.key.toLowerCase()).slice(-30);
      const match = triggers.find((trigger) => buffer.includes(trigger));
      if (match) {
        setFlashImage(match);
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => {
          setFlashImage(null);
        }, 5000);
        buffer = "";
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(flashTimer);
    };
  }, [isUnlocked]);

  useEffect(() => {
    document.body.classList.toggle("cursor-with-friend", showFriend);

    return () => {
      document.body.classList.remove("cursor-with-friend");
    };
  }, [showFriend]);

  useEffect(() => {
    const doc = new Y.Doc();
    const roomName = "zastrow-homepage-cursors";
    const servers = [
      "wss://demos.yjs.dev",
      "wss://yjs-server.herokuapp.com",
    ];
    let serverIndex = 0;
    let provider = null;
    let awareness = null;
    let statusTimer = null;
    let connectTimeout = null;
    let handleStatus = null;

    const createProvider = () => {
      if (awareness) {
        awareness.off("change", handleAwarenessChange);
      }
      if (provider && handleStatus) {
        provider.off("status", handleStatus);
        provider.destroy();
      }
      const serverUrl = servers[serverIndex % servers.length];
      provider = new WebsocketProvider(serverUrl, roomName, doc);
      awareness = provider.awareness;
      awarenessRef.current = awareness;
      localIdRef.current = awareness.clientID;
      setConnectionStatus(`connecting (${serverUrl})`);

      handleStatus = (event) => {
        const statusText = event.status || "disconnected";
        setConnectionStatus(`${statusText} (${serverUrl})`);
        if (event.status === "disconnected") {
          serverIndex += 1;
          clearTimeout(connectTimeout);
          connectTimeout = setTimeout(createProvider, 500);
        }
      };

      awareness.on("change", handleAwarenessChange);
      provider.on("status", handleStatus);

      clearInterval(statusTimer);
      statusTimer = setInterval(() => {
        setConnectionStatus(
          provider.wsconnected
            ? `connected (${serverUrl})`
            : `disconnected (${serverUrl})`
        );
      }, 1000);

      clearTimeout(connectTimeout);
      connectTimeout = setTimeout(() => {
        if (!provider.wsconnected) {
          serverIndex += 1;
          createProvider();
        }
      }, 5000);
    };

    const handleAwarenessChange = () => {
      if (!awareness) {
        return;
      }
      const states = Array.from(awareness.getStates().values());
      const cursors = states
        .map((state) => state.cursor)
        .filter(Boolean)
        .filter((cursor) => cursor.clientId !== localIdRef.current);
      setRemoteCursors(cursors);
      setPeerCount(Math.max(0, states.length - 1));
    };

    createProvider();
    handleAwarenessChange();
    localColorRef.current = `hsl(${Math.random() * 360}, 60%, 45%)`;

    return () => {
      if (awareness) {
        awareness.off("change", handleAwarenessChange);
      }
      if (provider && handleStatus) {
        provider.off("status", handleStatus);
        provider.destroy();
      }
      clearInterval(statusTimer);
      clearTimeout(connectTimeout);
      doc.destroy();
    };
  }, []);

  useEffect(() => {
    const onMove = (event) => {
      const awareness = awarenessRef.current;
      if (!awareness) {
        return;
      }
      awareness.setLocalStateField("cursor", {
        id: awareness.clientID,
        clientId: awareness.clientID,
        x: event.clientX,
        y: event.clientY,
        color: localColorRef.current,
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const inchDistance = Math.min(unlockProgress.length * 2, 120);

  return (
    <main className="page">
      {!isUnlocked && (
        <div
          className={`secret-walker ${
            unlockProgress.length > 0 ? "secret-walker--visible" : ""
          }`}
          style={{ transform: `translateX(-${inchDistance}px)` }}
          aria-hidden="true"
        />
      )}
      {isUnlocked && (
        <>
          <h1>
            Hi from Otto{" "}
            <button
              type="button"
              className="ampersand-toggle"
              onClick={() => setShowFriend(true)}
              aria-label="Show Beanius"
            >
              &amp;
            </button>{" "}
            Beanius
          </h1>
          <div className="cursor-layer" aria-hidden="true">
            {remoteCursors.map((cursor) => (
              <div
                key={cursor.id}
                className="remote-cursor"
                style={{
                  left: `${cursor.x}px`,
                  top: `${cursor.y}px`,
                  background: cursor.color,
                }}
              />
            ))}
          </div>
          <div className="status">
            Multiplayer: {connectionStatus} · Peers: {peerCount}
          </div>
        </>
      )}
      {flashImage && (
        <div className="flash-overlay" role="status" aria-live="polite">
          <img
            className="flash-image"
            alt={`Placeholder for ${flashImage}`}
            src={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='%23222'/><stop offset='1' stop-color='%23555555'/></linearGradient></defs><rect width='640' height='360' fill='url(%23g)'/><rect x='24' y='24' width='592' height='312' rx='18' fill='%23ffffff' opacity='0.1'/><text x='50%' y='50%' fill='%23ffffff' font-size='28' font-family='Arial, sans-serif' text-anchor='middle'>${flashImage.toUpperCase()}</text><text x='50%' y='62%' fill='%23ffffff' font-size='16' font-family='Arial, sans-serif' text-anchor='middle'>placeholder image</text></svg>`}
          />
        </div>
      )}
    </main>
  );
};

export default App;
