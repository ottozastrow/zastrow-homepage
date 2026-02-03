const { useEffect } = React;

const App = () => {
  useEffect(() => {
    let step = false;
    let idleTimer;

    const onMove = () => {
      step = !step;
      document.body.classList.toggle("cursor-step-b", step);

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        document.body.classList.remove("cursor-step-b");
        step = false;
      }, 120);
    };

    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <main className="page">
      <h1>Hi from Otto &amp; Beanius</h1>
    </main>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
