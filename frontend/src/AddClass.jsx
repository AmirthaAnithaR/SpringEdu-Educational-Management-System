import { useState } from "react";

function AddClass({ classes, setClasses }) {
  const [className, setClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [teacher, setTeacher] = useState("");
  const [studentCount, setStudentCount] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const newClass = {
      id: Date.now(),
      className,
      gradeLevel,
      section,
      teacher,
      studentCount,
    };
    setClasses([...classes, newClass]);
    setClassName("");
    setGradeLevel("");
    setSection("");
    setTeacher("");
    setStudentCount("");
  }

  return (
    <div className="add-student-container">
      <h2>Add Class</h2>
      <form className="add-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Class Name (e.g., 10A)"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Grade Level"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Section"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          required
        />
<select className="form-select" value={teacher} onChange={(e) => setTeacher(e.target.value)} required>
  <option value="">Select Teacher</option>
  <option value="Mr. Kumar">Mr. Kumar</option>
  <option value="Ms. Anitha">Ms. Anitha</option>
  <option value="Dr. Sharma">Dr. Sharma</option>
</select>
        <input
          type="number"
          placeholder="Student Count"
          value={studentCount}
          onChange={(e) => setStudentCount(e.target.value)}
          required
        />
        <button type="submit" className="add-btn">Add Class</button>
      </form>
    </div>
  );
}
export default AddClass;
