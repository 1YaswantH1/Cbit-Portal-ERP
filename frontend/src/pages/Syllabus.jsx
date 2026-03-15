import { useState, useEffect } from "react";
import axios from "axios";
import "../css/Syllabus.css";

const Syllabus = () => {
  const [type, setType] = useState("ug");
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [regFilter, setRegFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/syllabus/${type}`);
      const syllabusData = res.data || [];

      const grouped = {};
      syllabusData.forEach((row) => {
        if (!grouped[row.branch]) {
          grouped[row.branch] = { sno: row.sno, branch: row.branch, items: [] };
        }
        grouped[row.branch].items.push({
          regulation: row.regulation,
          syllabus: row.syllabus,
        });
      });

      const groupedArray = Object.values(grouped);
      setData(groupedArray);

      const branchList = groupedArray.map((b) => b.branch).filter(Boolean);
      setBranches([...new Set(branchList)]);
    } catch (err) {
      console.error("Syllabus API error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const filteredByBranch = branchFilter
    ? data.filter((b) => b.branch === branchFilter)
    : data;

  const regs = [
    ...new Set(
      filteredByBranch.flatMap((b) => b.items.map((i) => i.regulation)),
    ),
  ];

  const filtered = filteredByBranch
    .map((b) => ({
      ...b,
      items: b.items.filter((i) => !regFilter || i.regulation === regFilter),
    }))
    .filter((b) => b.items.length > 0);

  return (
    <div className="syllabus-container">
      <h2 className="syllabus-title">CBIT Syllabus</h2>

      <div className="filters">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setBranchFilter("");
            setRegFilter("");
          }}
        >
          <option value="ug">UG</option>
          <option value="pg">PG</option>
        </select>

        <select
          value={branchFilter}
          onChange={(e) => {
            setBranchFilter(e.target.value);
            setRegFilter("");
          }}
        >
          <option value="">All Branches</option>
          {branches.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={regFilter}
          onChange={(e) => setRegFilter(e.target.value)}
        >
          <option value="">All Regulations</option>
          {regs.map((r, i) => (
            <option key={i} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <table className="syllabus-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Branch</th>
            <th>Regulation</th>
            <th>Syllabus</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((branch, index) =>
            branch.items.map((item, i) => (
              <tr key={`${index}-${i}`}>
                {i === 0 && (
                  <>
                    <td rowSpan={branch.items.length}>{index + 1}</td>
                    <td rowSpan={branch.items.length}>{branch.branch}</td>
                  </>
                )}
                <td>{item.regulation}</td>
                <td>
                  {(item.syllabus || []).map((s, j) => (
                    <div key={j}>
                      <a href={s.link} target="_blank" rel="noreferrer">
                        {s.text}
                      </a>
                    </div>
                  ))}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Syllabus;
