import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

const App = () => {
  const [showFriend, setShowFriend] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState([]);
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
    document.body.classList.toggle("cursor-with-friend", showFriend);

    return () => {
      document.body.classList.remove("cursor-with-friend");
    };
  }, [showFriend]);

  useEffect(() => {
    const doc = new Y.Doc();
    const roomName = "zastrow-homepage-cursors";
    const provider = new WebrtcProvider(roomName, doc);
    const awareness = provider.awareness;

    awarenessRef.current = awareness;
    localIdRef.current = awareness.clientID;
    localColorRef.current = `hsl(${awareness.clientID * 137.5}, 60%, 45%)`;

    const handleAwarenessChange = () => {
      const states = Array.from(awareness.getStates().values());
      const cursors = states
        .map((state) => state.cursor)
        .filter(Boolean)
        .filter((cursor) => cursor.clientId !== localIdRef.current);
      setRemoteCursors(cursors);
    };

    awareness.on("change", handleAwarenessChange);
    handleAwarenessChange();

    return () => {
      awareness.off("change", handleAwarenessChange);
      provider.destroy();
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

  return (
    <main className="page">
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
    </main>
  );
};

export default App;
