import { useEffect, useState } from 'react'
import axios from 'axios'

export default function TeacherGrades(){
  const [classes, setClasses] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [teacherSubjects, setTeacherSubjects] = useState([])
  const [terms, setTerms] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [grades, setGrades] = useState({}) // { student_id: { oral, test, exam, quiz } }
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(()=>{ (async()=>{
    try {
      const [cls, sub, ts, term] = await Promise.all([
        axios.get('/api/teacher/classes'),
        axios.get('/api/teacher/subjects'),
        axios.get('/api/teacher/teacher-subjects'),
        axios.get('/api/teacher/terms')
      ])
      setClasses(cls.data)
      setAllSubjects(sub.data)
      setTeacherSubjects(ts.data)
      setTerms(term.data)
    } catch {}
  })() }, [])

  // Filter subjects to only show those the teacher teaches
  const availableSubjects = allSubjects.filter(subject => 
    teacherSubjects.some(ts => ts.subject_id === subject.id)
  )

  useEffect(()=>{ (async()=>{
    if (!selectedClass) {
      setStudents([])
      return
    }
    setLoading(true)
    try {
      const { data } = await axios.get('/api/teacher/students', { 
        params: { class_id: selectedClass } 
      })
      setStudents(data)
      // Load existing grades if subject and term selected
      if (selectedSubject && selectedTerm) {
        loadExistingGrades()
      }
    } finally {
      setLoading(false)
    }
  })() }, [selectedClass])

  async function loadExistingGrades() {
    if (!selectedSubject || !selectedTerm) return
    try {
      const { data } = await axios.get('/api/teacher/grades/report', {
        params: { 
          class_id: selectedClass, 
          subject_id: selectedSubject, 
          term_id: selectedTerm 
        }
      })
      const gradeMap = {}
      data.forEach(row => {
        gradeMap[row.student_id] = {
          oral: row.oral || '',
          test: row.test || '',
          exam: row.exam || '',
          quiz: row.quiz || '',
          _exists: row.oral != null || row.test != null || row.exam != null || row.quiz != null
        }
      })
      setGrades(gradeMap)
    } catch {}
  }

  useEffect(()=>{ 
    if (selectedSubject && selectedTerm) {
      loadExistingGrades()
    }
  }, [selectedSubject, selectedTerm])

  function updateGrade(studentId, type, value) {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: value
      }
    }))
  }

  async function saveGrades() {
    if (!selectedClass || !selectedSubject || !selectedTerm) {
      setMsg('Vui lòng chọn đầy đủ lớp, môn và học kỳ')
      return
    }
    
    setMsg('')
    setLoading(true)
    try {
      const promises = Object.entries(grades).map(([studentId, scores]) => {
        if (!scores.oral && !scores.test && !scores.exam && !scores.quiz) return Promise.resolve()
        const payload = {
          student_user_id: studentId,
          subject_id: selectedSubject,
          term_id: selectedTerm,
          oral: scores.oral ? Number(scores.oral) : null,
          test: scores.test ? Number(scores.test) : null,
          exam: scores.exam ? Number(scores.exam) : null,
          quiz: scores.quiz ? Number(scores.quiz) : null
        }
        // Use PUT if grade existed before; else POST
        return (scores._exists ? axios.put('/api/teacher/grades', payload) : axios.post('/api/teacher/grades', payload))
      })
      
      await Promise.all(promises.filter(p => p))
      setMsg('Lưu điểm thành công')
    } catch {
      setMsg('Lưu điểm thất bại')
    } finally {
      setLoading(false)
    }
  }

  async function saveStudentGrade(studentId) {
    if (!selectedClass || !selectedSubject || !selectedTerm) {
      setMsg('Vui lòng chọn đầy đủ lớp, môn và học kỳ')
      return
    }
    
    const scores = grades[studentId] || {}
    if (!scores.oral && !scores.test && !scores.exam && !scores.quiz) {
      setMsg('Vui lòng nhập ít nhất một điểm')
      return
    }
    
    setMsg('')
    try {
      const payload = {
        student_user_id: studentId,
        subject_id: selectedSubject,
        term_id: selectedTerm,
        oral: scores.oral ? Number(scores.oral) : null,
        test: scores.test ? Number(scores.test) : null,
        exam: scores.exam ? Number(scores.exam) : null,
        quiz: scores.quiz ? Number(scores.quiz) : null
      }
      const existed = !!scores._exists
      await (existed ? axios.put('/api/teacher/grades', payload) : axios.post('/api/teacher/grades', payload))
      // Mark as existing after successful save
      setGrades(prev => ({
        ...prev,
        [studentId]: { ...(prev[studentId]||{}), _exists: true }
      }))
      setMsg('Lưu điểm thành công')
    } catch {
      setMsg('Lưu điểm thất bại')
    }
  }

  return (
    <div className="card">
      <h3>Nhập điểm học sinh</h3>
      
      <div className="row mt16">
        <select 
          className="input" 
          value={selectedClass} 
          onChange={e=>setSelectedClass(e.target.value)}
        >
          <option value="">-- Chọn lớp --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        <select 
          className="input" 
          value={selectedSubject} 
          onChange={e=>setSelectedSubject(e.target.value)}
          disabled={!selectedClass}
        >
          <option value="">-- Chọn môn học --</option>
          {availableSubjects.length === 0 ? (
            <option value="" disabled>Chưa được gán môn học nào</option>
          ) : (
            availableSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))
          )}
        </select>
        
        <select 
          className="input" 
          value={selectedTerm} 
          onChange={e=>setSelectedTerm(e.target.value)}
          disabled={!selectedClass}
        >
          <option value="">-- Chọn học kỳ --</option>
          {terms.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedClass && selectedSubject && selectedTerm && (
        <div className="mt24">
          <h4>Danh sách học sinh lớp {classes.find(c => c.id == selectedClass)?.name}</h4>
          <div className="row mt16">
            <button 
              className="btn" 
              onClick={saveGrades} 
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu tất cả điểm'}
            </button>
          </div>
          
          {loading && students.length === 0 ? (
            <div className="mt16">Đang tải danh sách học sinh...</div>
          ) : (
            <div className="table-responsive mt16">
              <table>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Điểm miệng (15p)</th>
                    <th>Điểm 1 tiết</th>
                    <th>Điểm giữa kỳ</th>
                    <th>Điểm cuối kỳ</th>
                    <th>Điểm TB</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const studentGrades = grades[student.id] || { oral: '', test: '', exam: '', quiz: '' }
                    const oral = Number(studentGrades.oral) || 0
                    const quiz = Number(studentGrades.quiz) || 0
                    const test = Number(studentGrades.test) || 0
                    const exam = Number(studentGrades.exam) || 0
                    const average = (oral + quiz + test + exam) / 4
                    
                    return (
                      <tr key={student.id}>
                        <td>{student.username}</td>
                        <td>
                          <input 
                            type="number" 
                            className="input" 
                            style={{width: 80}}
                            value={studentGrades.oral} 
                            onChange={e=>updateGrade(student.id, 'oral', e.target.value)}
                            placeholder="0-10"
                            min="0" 
                            max="10" 
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input" 
                            style={{width: 80}}
                            value={studentGrades.quiz} 
                            onChange={e=>updateGrade(student.id, 'quiz', e.target.value)}
                            placeholder="0-10"
                            min="0" 
                            max="10" 
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input" 
                            style={{width: 80}}
                            value={studentGrades.test} 
                            onChange={e=>updateGrade(student.id, 'test', e.target.value)}
                            placeholder="0-10"
                            min="0" 
                            max="10" 
                            step="0.1"
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input" 
                            style={{width: 80}}
                            value={studentGrades.exam} 
                            onChange={e=>updateGrade(student.id, 'exam', e.target.value)}
                            placeholder="0-10"
                            min="0" 
                            max="10" 
                            step="0.1"
                          />
                        </td>
                        <td>
                          <span style={{fontWeight: 'bold'}}>
                            {average > 0 ? average.toFixed(1) : ''}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn" 
                            onClick={() => saveStudentGrade(student.id)}
                            style={{fontSize: '12px', padding: '4px 8px'}}
                          >
                            Lưu
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {msg && <div className="mt16" style={{color: msg.includes('thành công') ? 'green' : 'red'}}>{msg}</div>}
    </div>
  )
}


