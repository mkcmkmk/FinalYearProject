import { useState } from "react";
import axios from "axios";
import "./TeacherJoinForm.css";

const instrumentsList = ["Guitar", "Piano", "Vocal", "Drums", "Violin", "Bass", "Flute", "Saxophone"];

const TeacherJoinForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    yearsOfExperience: "",
    teacherBio: "",
  });
  const [expertises, setExpertises] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onCheckboxChange = (e) => {
    const value = e.target.value;
    setExpertises((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    if (expertises.length === 0) {
      setStatus({ loading: false, error: "Please select at least one expertise.", success: null });
      return;
    }

    try {
      const payload = {
        ...form,
        role: "teacher",
        instrumentExpertise: expertises.join(", "),
        contactNumber: form.contactNumber ? Number(form.contactNumber) : null,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
      };

      const res = await axios.post("http://localhost:3000/api/auth/register", payload);

      if (res.data.success) {
        setStatus({ loading: false, error: null, success: "Application submitted! Admin will review and notify you via email." });
        setForm({
          name: "",
          email: "",
          contactNumber: "",
          yearsOfExperience: "",
          teacherBio: "",
        });
        setExpertises([]);
      }
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.message || "Something went wrong.",
        success: null,
      });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Join as a Teacher</h3>
        <p>Apply to become an instructor on Harmoniq and start managing classes.</p>
      </div>

      {status.success && <div className="alert alert-success" style={{ marginBottom: "16px" }}>{status.success}</div>}
      {status.error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{status.error}</div>}

      <form onSubmit={handleSubmit} className="teacher-join-form card-body">
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="name" value={form.name} onChange={onChange} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} required />
        </div>

        <div className="form-group">
          <label>Contact Number</label>
          <input type="tel" name="contactNumber" value={form.contactNumber} onChange={onChange} required />
        </div>

        <div className="form-group">
          <label>Instrument Expertise</label>
          <div className="expertise-grid">
            {instrumentsList.map((inst) => (
              <label key={inst} className="expertise-checkbox">
                <input
                  type="checkbox"
                  value={inst}
                  checked={expertises.includes(inst)}
                  onChange={onCheckboxChange}
                />
                {inst}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Years of Experience</label>
          <input type="number" name="yearsOfExperience" min="0" value={form.yearsOfExperience} onChange={onChange} required />
        </div>

        <div className="form-group">
          <label>Teacher Bio</label>
          <textarea
            name="teacherBio"
            value={form.teacherBio}
            onChange={onChange}
            placeholder="Tell us about your teaching background..."
            required
            rows={4}
          />
        </div>

        <button type="submit" disabled={status.loading} className="btn btn-primary btn-block">
          {status.loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default TeacherJoinForm;
