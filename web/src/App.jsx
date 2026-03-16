import "./App.css";

function App() {
  return (
    <div className="container">
      <span className="badge">Docker Optimization</span>
      <h1>Image Optimization</h1>
      <p className="subtitle">
        Multi-stage builds para remover <code>node_modules</code> da imagem final.
      </p>

      <div className="card">
        <h2>⚙️ Pipeline de Build</h2>

        <div className="stage">
          <div className="stage-number builder">1</div>
          <div className="stage-info">
            <strong>Stage: builder</strong>
            <span>
              Instala todas as deps + compila o código. <br />
              <code>node_modules</code> existe aqui, mas será descartado.
            </span>
          </div>
        </div>

        <div className="stage">
          <div className="stage-number production">2</div>
          <div className="stage-info">
            <strong>Stage: production</strong>
            <span>
              Copia apenas o output do build (<code>/dist</code>). <br />
              Servido pelo <strong>nginx:alpine</strong> — sem Node, sem <code>node_modules</code>.
            </span>
          </div>
        </div>
      </div>

      <div className="result-card">
        <div className="result-icon">🚀</div>
        <div>
          <p>Imagem final ~25MB vs ~500MB sem otimização</p>
          <small>node_modules não existe neste container</small>
        </div>
      </div>
    </div>
  );
}

export default App;
