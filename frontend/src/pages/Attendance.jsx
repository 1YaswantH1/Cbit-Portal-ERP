import { useState } from "react";
import "../css/Attendance.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ─────────────────────────────────────────
   CONSTANTS & PURE HELPERS
───────────────────────────────────────── */
const TARGETS = [85, 80, 75, 70, 65];

function getNextTarget(percent) {
  for (const t of [...TARGETS].reverse()) {
    if (percent < t) return t;
  }
  return 85;
}

function classesNeeded(attended, held, target) {
  const T = target / 100;
  if (attended / held >= T) return 0;
  return Math.ceil((T * held - attended) / (1 - T));
}

function safeBunks(attended, held, target) {
  const T = target / 100;
  return Math.max(Math.floor(attended / T - held), 0);
}

function getRiskSlug(percent) {
  if (percent >= 85) return "safe";
  if (percent >= 75) return "stable";
  if (percent >= 65) return "risk";
  return "critical";
}

function getRiskLabel(percent) {
  return { safe: "Safe", stable: "Stable", risk: "Risk", critical: "Critical" }[
    getRiskSlug(percent)
  ];
}

function percentColorClass(percent) {
  if (percent >= 85) return "color-green";
  if (percent >= 75) return "color-amber";
  if (percent >= 65) return "color-orange";
  return "color-red";
}

/* ─────────────────────────────────────────
   OPTIMAL PLAN ALGORITHM
───────────────────────────────────────── */
function computeOptimalPlan(processed) {
  let subjects = processed.map((s) => ({
    name: s.subject,
    held: s.held,
    attended: s.attended,
  }));

  let totalHeld = subjects.reduce((s, r) => s + r.held, 0);
  let totalAtt = subjects.reduce((s, r) => s + r.attended, 0);

  const plan = {};
  subjects.forEach((s) => (plan[s.name] = 0));

  if (totalHeld === 0 || totalAtt / totalHeld >= 0.75) return plan;

  const totalNeeded = Math.ceil((0.75 * totalHeld - totalAtt) / 0.25);
  let remaining = totalNeeded;

  while (remaining > 0) {
    subjects.sort((a, b) => a.attended / a.held - b.attended / b.held);
    const weakest = subjects[0];

    let batch;
    if (subjects.length > 1) {
      const nextRatio = subjects[1].attended / subjects[1].held;
      const k = (nextRatio * weakest.held - weakest.attended) / (1 - nextRatio);
      batch = Math.max(1, Math.min(remaining, Math.floor(k) || 1));
    } else {
      batch = remaining;
    }

    weakest.attended += batch;
    weakest.held += batch;
    plan[weakest.name] = (plan[weakest.name] || 0) + batch;
    remaining -= batch;
  }

  return plan;
}

/* ─────────────────────────────────────────
   CHART CONFIG
───────────────────────────────────────── */
const BAR_COLORS = {
  safe: "#059669cc",
  stable: "#d97706cc",
  risk: "#ea580ccc",
  critical: "#dc2626cc",
};

function buildChartData(processed) {
  // Check if all subjects share the same target — if so, label it clearly,
  // otherwise use a generic "Target" label since values differ per subject.
  const targets = processed.map((s) => s.target);
  const allSameTarget = targets.every((t) => t === targets[0]);
  const targetLabel = allSameTarget ? `Target ${targets[0]}%` : "Target %";

  return {
    labels: processed.map((s) =>
      s.subject.length > 18 ? s.subject.slice(0, 18) + "…" : s.subject,
    ),
    datasets: [
      {
        label: "Attendance %",
        data: processed.map((s) => s.percent),
        backgroundColor: processed.map(
          (s) => BAR_COLORS[getRiskSlug(s.percent)],
        ),
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: targetLabel,
        // Each bar uses that subject's own target from the dropdown
        data: processed.map((s) => s.target),
        backgroundColor: "rgba(13,13,13,0.07)",
        borderColor: "rgba(13,13,13,0.25)",
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  };
}

const CHART_OPTIONS = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: "#6b7280",
        font: { size: 12, family: "'Inter', sans-serif" },
        boxWidth: 12,
        boxHeight: 12,
      },
    },
    tooltip: {
      backgroundColor: "#0d0d0d",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      titleColor: "#ffffff",
      bodyColor: "#9ca3af",
      padding: 12,
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#9ca3af", font: { size: 11 } },
      grid: { color: "rgba(0,0,0,0.05)" },
    },
    y: {
      min: 0,
      max: 100,
      ticks: {
        color: "#9ca3af",
        font: { size: 11 },
        callback: (v) => v + "%",
      },
      grid: { color: "rgba(0,0,0,0.05)" },
    },
  },
};

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function PctBar({ percent }) {
  const slug = getRiskSlug(percent);
  return (
    <div className="pct-bar-wrap">
      <div className="pct-bar-bg">
        <div
          className={`pct-bar-fill ${slug}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className={`pct-label ${slug}`}>{percent}%</span>
    </div>
  );
}

function RiskBadge({ percent }) {
  const slug = getRiskSlug(percent);
  return (
    <span className={`risk-badge ${slug}`}>
      <span className={`risk-dot ${slug}`} />
      {getRiskLabel(percent)}
    </span>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Attendance() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [samePass, setSamePass] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [customTargets, setCustomTargets] = useState({});
  const [showPlan, setShowPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalPassword = samePass ? username : password;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password: finalPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }

      setStudentName(data.studentName);
      setAttendance(data.attendance);
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setErrorMsg("Something went wrong with ERP. Please try again later.");
    }

    setLoading(false);
  };

  const subjects = attendance.slice(0, -1);

  const processed = subjects.map((row, i) => {
    const subject = row[1];
    const held = Number(row[3]);
    const attended = Number(row[4]);
    const percent = Number(row[5]);
    const autoTarget = getNextTarget(percent);
    const target =
      customTargets[i] !== undefined ? customTargets[i] : autoTarget;
    const need = classesNeeded(attended, held, target);
    const bunks = safeBunks(attended, held, target);
    return { subject, held, attended, percent, target, need, bunks };
  });

  const totalHeld = processed.reduce((s, r) => s + r.held, 0);
  const totalAtt = processed.reduce((s, r) => s + r.attended, 0);
  const overallPercent =
    totalHeld > 0 ? ((totalAtt / totalHeld) * 100).toFixed(1) : 0;
  const overallNeed = classesNeeded(totalAtt, totalHeld, 75);
  const overallBunks = safeBunks(totalAtt, totalHeld, 75);

  const optimalPlan = processed.length > 0 ? computeOptimalPlan(processed) : {};
  const planEntries = Object.entries(optimalPlan).filter(([, v]) => v > 0);
  const planTotal = planEntries.reduce((s, [, v]) => s + v, 0);

  const chartData = buildChartData(processed);

  return (
    <div className="att-root">
      <div className="att-inner">
        {/* HEADER */}
        <div className="att-header">
          <h1>Attendance Planner</h1>
          <p>CBIT · Smart attendance tracking &amp; optimisation</p>
        </div>

        {/* FORM */}
        <div className="att-form-card">
          <form onSubmit={handleSubmit}>
            <div className="att-row">
              <input
                className="att-input"
                placeholder="ERP Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button className="att-btn" type="submit">
                Fetch
              </button>
            </div>

            <label className="att-check">
              <input
                type="checkbox"
                checked={samePass}
                onChange={() => setSamePass(!samePass)}
              />
              Username = Password
            </label>

            {!samePass && (
              <div className="att-pass-wrap">
                <input
                  className="att-input"
                  type="password"
                  placeholder="ERP Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </form>
          {errorMsg && <div className="att-error">{errorMsg}</div>}
        </div>

        {loading && <p className="att-loading">Fetching attendance data…</p>}
        {studentName && <p className="att-name">{studentName}</p>}

        {/* SUMMARY */}
        {processed.length > 0 && (
          <div className="att-summary">
            <div className="sum-card">
              <span className="sum-label">Overall Attendance</span>
              <span
                className={`sum-value ${percentColorClass(Number(overallPercent))}`}
              >
                {overallPercent}%
              </span>
              <span className="sum-sub">
                {totalAtt} of {totalHeld} classes
              </span>
            </div>

            <div
              className="sum-card clickable"
              onClick={() => setShowPlan(!showPlan)}
              title="Click to see optimal plan"
            >
              <span className="sum-label">Classes Needed (75%)</span>
              <span
                className={`sum-value ${overallNeed > 0 ? "color-red" : "color-green"}`}
              >
                {overallNeed}
              </span>
              <span className="sum-sub">
                {showPlan ? "▲ Hide plan" : "▼ View optimal plan"}
              </span>
            </div>

            <div className="sum-card">
              <span className="sum-label">Safe Bunks (75%)</span>
              <span
                className={`sum-value ${overallBunks > 0 ? "color-green" : "color-muted"}`}
              >
                {overallBunks}
              </span>
              <span className="sum-sub">across all subjects</span>
            </div>
          </div>
        )}

        {/* OPTIMAL PLAN */}
        {showPlan && processed.length > 0 && (
          <div className="plan-card">
            <h3>
              {planEntries.length === 0
                ? "✓ Already at 75% overall"
                : `Optimal Plan — attend ${planTotal} class${planTotal !== 1 ? "es" : ""} to reach 75% overall`}
            </h3>

            {planEntries.length === 0 ? (
              <p className="plan-empty">No action needed. Keep it up!</p>
            ) : (
              <div className="plan-grid">
                {[...planEntries]
                  .sort(([, a], [, b]) => b - a)
                  .map(([sub, v]) => (
                    <div className="plan-item" key={sub}>
                      <div className="plan-dot" />
                      <div>
                        <div>
                          <b>{v}</b> class{v !== 1 ? "es" : ""}
                        </div>
                        <div className="plan-item-sub">{sub}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* CHART */}
        {processed.length > 0 && (
          <div className="att-chart-wrap">
            <p className="section-title">Subject Breakdown</p>
            <Bar data={chartData} options={CHART_OPTIONS} />
          </div>
        )}

        {/* TABLE */}
        {processed.length > 0 && (
          <div className="att-table-wrap">
            <div className="att-table-head">
              <p className="section-title">Attendance Planner</p>
            </div>

            <table className="att-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>To Attend</th>
                  <th>Can Miss</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((row, i) => (
                  <tr key={i}>
                    <td className="subj-name">{row.subject}</td>
                    <td>
                      <PctBar percent={row.percent} />
                    </td>
                    <td>
                      <RiskBadge percent={row.percent} />
                    </td>
                    <td>
                      <select
                        className="target-select"
                        value={row.target}
                        onChange={(e) =>
                          setCustomTargets({
                            ...customTargets,
                            [i]: Number(e.target.value),
                          })
                        }
                      >
                        {[85, 80, 75, 70, 65].map((t) => (
                          <option key={t} value={t}>
                            {t}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={`num-pill ${row.need > 0 ? "need" : "zero"}`}
                      >
                        {row.need > 0 ? `+${row.need}` : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`num-pill ${row.bunks > 0 ? "bunk" : "zero"}`}
                      >
                        {row.bunks > 0 ? row.bunks : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
