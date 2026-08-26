import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import jsPDF from "jspdf";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Target,
  Loader2
} from "lucide-react";

import Login from "./components/Login";
import Signup from "./components/Signup";
import "./styles.css";

const API = "http://localhost:5000/api";

function Score({ label, value }) {
  return (
    <div className="score-card">
      <div className="score-ring">{value}</div>

      <div>
        <h3>{label}</h3>
        <p>out of 100</p>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [showSignup, setShowSignup] = useState(false);

  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  // =========================
  // LOAD USER HISTORY
  // =========================
  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token || !user) {
    setHistory([]);
    return;
  }

  axios
    .get(`${API}/history`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log("History loaded:", response.data);
      setHistory(response.data);
    })
    .catch((error) => {
      console.error("History error:", error);
      setHistory([]);
    });
}, [user]);
  // =========================
  // LOGIN
  // =========================
  function handleLogin(userData) {
    setUser(userData);
    setShowSignup(false);
  }

  // =========================
  // SIGNUP
  // =========================
  function handleSignup(userData) {
    setUser(userData);
    setShowSignup(false);
  }

  // =========================
  function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  setHistory([]);
  setResult(null);
  setFile(null);
  setJobDescription("");
  setError("");

  setUser(null);
}
    

  // =========================
  // LOGIN / SIGNUP SCREEN
  // =========================
  if (!user) {
    if (showSignup) {
      return (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={() => setShowSignup(false)}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToSignup={() => setShowSignup(true)}
      />
    );
  }

  // =========================
  // ANALYZE RESUME
  // =========================
  function downloadReport() {
  if (!result) return;

  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(22);
  doc.text("ResumeAI - Resume Analysis Report", 20, y);

  y += 15;

  doc.setFontSize(12);
  doc.text(`Candidate: ${user.name}`, 20, y);

  y += 8;

  doc.text(`Resume: ${file?.name || "Resume"}`, 20, y);

  y += 15;

  doc.setFontSize(16);
  doc.text("Scores", 20, y);

  y += 10;

  doc.setFontSize(12);
  doc.text(`Overall Score: ${result.overallScore}/100`, 20, y);

  y += 8;

  doc.text(`ATS Score: ${result.atsScore}/100`, 20, y);

  y += 8;

  doc.text(`Word Count: ${result.wordCount}`, 20, y);

  y += 15;

  doc.setFontSize(16);
  doc.text("Skills Detected", 20, y);

  y += 8;

  doc.setFontSize(11);

  const skills = result.skills?.join(", ") || "None detected";

  const skillLines = doc.splitTextToSize(skills, 170);

  doc.text(skillLines, 20, y);

  y += skillLines.length * 6 + 10;

  doc.setFontSize(16);
  doc.text("Strengths", 20, y);

  y += 8;

  doc.setFontSize(11);

  result.strengths?.forEach((item) => {
    const lines = doc.splitTextToSize(`• ${item}`, 170);

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, 20, y);

    y += lines.length * 6 + 2;
  });

  y += 8;

  doc.setFontSize(16);
  doc.text("Weaknesses", 20, y);

  y += 8;

  doc.setFontSize(11);

  result.weaknesses?.forEach((item) => {
    const lines = doc.splitTextToSize(`• ${item}`, 170);

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, 20, y);

    y += lines.length * 6 + 2;
  });

  y += 8;

  doc.setFontSize(16);
  doc.text("Recommendations", 20, y);

  y += 8;

  doc.setFontSize(11);

  result.recommendations?.forEach((item, index) => {
    const lines = doc.splitTextToSize(
      `${index + 1}. ${item}`,
      170
    );

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, 20, y);

    y += lines.length * 6 + 2;
  });

  doc.save("ResumeAI-Analysis-Report.pdf");
}
  async function analyze() {
    if (!file) {
      setError("Please select a PDF resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();

    form.append("resume", file);
    form.append("jobDescription", jobDescription);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(`${API}/analyze`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      setResult(response.data.result);

      // Reload history after new analysis
      const historyResponse = await axios.get(`${API}/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setHistory(historyResponse.data);
    } catch (e) {
      console.error(e);

      setError(
        e.response?.data?.message ||
          "Something went wrong while analyzing the resume."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // MAIN DASHBOARD
  // =========================
  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}
      <nav>
        <div className="brand">
          <Sparkles size={22} />
          ResumeAI
        </div>

        <div className="nav-right">
          <span>Hi, {user.name} 👋</span>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <main>

        {/* =========================
            HERO
        ========================= */}
        <section className="hero">

          <div className="badge">
            <Sparkles size={15} />
            AI-powered career assistant
          </div>

          <h1>
            Make your resume
            <br />
            <span>job-ready.</span>
          </h1>

          <p>
            Upload your resume and get an ATS-style score, skill insights,
            keyword gaps and practical improvement suggestions.
          </p>

        </section>

        {/* =========================
            UPLOAD PANEL
        ========================= */}
        <section className="panel">

          <div
            className="dropzone"
            onClick={() =>
              document.getElementById("resume").click()
            }
          >

            <input
              id="resume"
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />

            <Upload size={38} />

            <h2>
              {file
                ? file.name
                : "Upload your resume"}
            </h2>

            <p>
              {file
                ? "PDF selected. Click Analyze when ready."
                : "PDF only • maximum 5 MB"}
            </p>

          </div>

          <label className="label">
            Optional: paste the job description
          </label>

          <textarea
            value={jobDescription}
            onChange={(e) =>
              setJobDescription(e.target.value)
            }
            placeholder="Paste a job description here to compare your resume against it..."
          />

          {error && (
            <div className="error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            className="analyze-btn"
            onClick={analyze}
            disabled={loading}
          >

            {loading ? (
              <>
                <Loader2
                  className="spin"
                  size={20}
                />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze Resume
              </>
            )}

          </button>

        </section>

        {/* =========================
            RESULTS
        ========================= */}
        {result && (
          <section className="results">

            <div className="results-head">

              <div>

                <div className="badge">
                  <CheckCircle size={15} />
                  Analysis complete
                </div>

                <div className="report-title-row">

                  <h2>
                    Your Resume Report
                  </h2>

                  <button
  className="download-btn"
  onClick={downloadReport}
>
  📥 Download Report
</button>

                </div>

              </div>

              <p>
                {result.summary}
              </p>

            </div>

            {/* =========================
                SCORES
            ========================= */}
            <div className="scores">

              <Score
                label="Overall Score"
                value={result.overallScore}
              />

              <Score
                label="ATS Score"
                value={result.atsScore}
              />

              <Score
                label="Word Count"
                value={result.wordCount}
              />

            </div>

            {/* =========================
                CARDS
            ========================= */}
            <div className="grid">

              {/* Strengths */}
              <div className="card">

                <h3>
                  <CheckCircle size={19} />
                  Strengths
                </h3>

                <ul>
                  {result.strengths?.map(
                    (x, i) => (
                      <li key={i}>
                        {x}
                      </li>
                    )
                  )}
                </ul>

              </div>

              {/* Weaknesses */}
              <div className="card">

                <h3>
                  <AlertCircle size={19} />
                  Weaknesses
                </h3>

                <ul>
                  {result.weaknesses?.map(
                    (x, i) => (
                      <li key={i}>
                        {x}
                      </li>
                    )
                  )}
                </ul>

              </div>

              {/* Skills */}
              <div className="card">

                <h3>
                  <Target size={19} />
                  Skills detected
                </h3>

                <div className="chips">

                  {result.skills?.map(
                    (x, i) => (
                      <span key={i}>
                        {x}
                      </span>
                    )
                  )}

                </div>

              </div>

              {/* Keywords */}
              <div className="card">

                <h3>
                  <FileText size={19} />
                  Keyword match
                </h3>

                <div className="chips">

                  {result.matchingKeywords?.map(
                    (x, i) => (
                      <span
                        className="good"
                        key={i}
                      >
                        {x}
                      </span>
                    )
                  )}

                </div>

                <div className="chips">

                  {result.missingKeywords?.map(
                    (x, i) => (
                      <span
                        className="bad"
                        key={i}
                      >
                        {x}
                      </span>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* =========================
                RECOMMENDATIONS
            ========================= */}
            <div className="card recommendations">

              <h3>
                <Sparkles size={19} />
                Recommended improvements
              </h3>

              <ol>

                {result.recommendations?.map(
                  (x, i) => (
                    <li key={i}>
                      {x}
                    </li>
                  )
                )}

              </ol>

            </div>

          </section>
        )}

        {/* =========================
            HISTORY
        ========================= */}
        {history.length > 0 && (
          <section className="history-section">

            <div className="results-head">

              <div>

                <div className="badge">
                  <FileText size={15} />
                  Previous analyses
                </div>

                <h2>
                  Analysis History
                </h2>

              </div>

            </div>

            <div className="history-list">

              {history.map((item) => (

                <div
                  className="history-item"
                  key={item._id}
                >

                  <div className="history-file">

                    <FileText size={22} />

                    <div>

                      <strong>
                        {item.fileName}
                      </strong>

                      <p>
                        {new Date(
                          item.createdAt
                        ).toLocaleDateString()}
                      </p>

                    </div>

                  </div>

                  <div className="history-score">

                    <strong>
                      {item.result?.overallScore ?? 0}
                    </strong>

                    <span>
                      Score
                    </span>

                  </div>

                  <div className="history-score">

                    <strong>
                      {item.result?.atsScore ?? 0}
                    </strong>

                    <span>
                      ATS
                    </span>

                  </div>

                </div>

              ))}

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

ReactDOM
  .createRoot(document.getElementById("root"))
  .render(<App />);