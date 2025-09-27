import { useEffect, useState } from 'react'
import axios from 'axios'

// Format date from ISO string to dd/mm/yyyy
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Format time from HH:MM:SS to HH:MM
function formatTime(timeString) {
  if (!timeString) return ''
  return timeString.substring(0, 5)
}

export default function AdminTimetable(){
  const [terms, setTerms] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [periods, setPeriods] = useState([])
  const [timetableEntries, setTimetableEntries] = useState([])
  const [levels, setLevels] = useState([])
  const [grades, setGrades] = useState([])
  
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  
  const [msg, setMsg] = useState('')
  const [activeView, setActiveView] = useState('create') // 'create' | 'view'

  const daysOfWeek = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 7, label: 'Chủ nhật' }
  ]

  useEffect(()=>{ (async()=>{
    const [tm, cls, sub, tch, per, lv, grd] = await Promise.all([
      axios.get('/api/admin/terms'),
      axios.get('/api/admin/classes'),
      axios.get('/api/admin/subjects'),
      axios.get('/api/admin/users?role=TEACHER'),
      axios.get('/api/admin/periods'),
      axios.get('/api/admin/levels'),
      axios.get('/api/admin/grades')
    ])
    setTerms(tm.data); setClasses(cls.data); setSubjects(sub.data); 
    setTeachers(tch.data); setPeriods(per.data); setLevels(lv.data); setGrades(grd.data)
  })() }, [])

  // Load timetable entries khi chọn term và class
  useEffect(()=>{ (async()=>{
    if (!selectedTerm || !selectedClass) {
      setTimetableEntries([])
      return
    }
    try {
      const { data } = await axios.get('/api/admin/timetable-entries', {
        params: { term_id: selectedTerm, class_id: selectedClass }
      })
      setTimetableEntries(data)
    } catch (err) {
      setTimetableEntries([])
    }
  })() }, [selectedTerm, selectedClass])

  // Filter terms theo level được chọn - tạm thời hiển thị tất cả terms
  const filteredTerms = selectedLevel ? terms : []

  // Debug log để kiểm tra filtering
  console.log('Selected level:', selectedLevel)
  console.log('All terms:', terms)
  console.log('Filtered terms:', filteredTerms)
  console.log('Level grades:', grades.filter(g => String(g.level_id) === String(selectedLevel)))
  console.log('Level classes:', classes.filter(c => {
    const levelGrades = grades.filter(g => String(g.level_id) === String(selectedLevel))
    const levelGradeIds = levelGrades.map(g => g.id)
    return levelGradeIds.includes(c.grade_id)
  }))

  // Filter subjects theo grade của class được chọn
  const filteredSubjects = subjects.filter(subject => {
    if (!selectedClass) return false
    const selectedClassObj = classes.find(c => String(c.id) === String(selectedClass))
    if (!selectedClassObj) return false
    
    // Lấy grade_id từ class
    const grade = grades.find(g => String(g.id) === String(selectedClassObj.grade_id))
    if (!grade) return false
    
    // Chỉ hiển thị subjects được gán cụ thể cho grade này
    // Subject phải có grade_id trùng với grade của class được chọn
    return String(subject.grade_id) === String(grade.id)
  })


  // State để lưu teacher-subjects assignments
  const [teacherSubjects, setTeacherSubjects] = useState([])

  // Load teacher-subjects khi component mount
  useEffect(()=>{ (async()=>{
    try {
      const { data } = await axios.get('/api/admin/teacher-subjects')
      setTeacherSubjects(data)
    } catch (err) {
      setTeacherSubjects([])
    }
  })() }, [])

  // Filter teachers theo subject được chọn
  const filteredTeachers = teachers.filter(teacher => {
    if (!selectedSubject) return false
    
    // Tìm xem teacher có dạy subject này không
    const teacherSubject = teacherSubjects.find(ts => 
      String(ts.teacher_user_id) === String(teacher.id) && 
      String(ts.subject_id) === String(selectedSubject)
    )
    
    return !!teacherSubject
  })

  // Tạo danh sách periods có thể chọn dựa trên level của class
  const availablePeriods = (() => {
    if (!selectedClass) return []
    
    const selectedClassObj = classes.find(c => String(c.id) === String(selectedClass))
    if (!selectedClassObj) return []
    
    // Lấy grade_id từ class, sau đó lấy level_id từ grade
    const grade = grades.find(g => String(g.id) === String(selectedClassObj.grade_id))
    if (!grade) return []
    
    // Lấy tất cả periods của level này để xác định max periods
    const levelPeriods = periods.filter(period => 
      String(period.level_id) === String(grade.level_id)
    )
    
    // Lấy max period_index của level này
    const maxPeriods = Math.max(...levelPeriods.map(p => p.period_index), 5)
    
    // Tạo danh sách periods có thể chọn (1 đến maxPeriods)
    const periodsList = []
    for (let i = 1; i <= maxPeriods; i++) {
      // Tìm period mẫu của tiết này (lấy bất kỳ ngày nào)
      const samplePeriod = levelPeriods.find(p => p.period_index === i)
      if (samplePeriod) {
        periodsList.push({
          period_index: i,
          start_time: samplePeriod.start_time,
          end_time: samplePeriod.end_time
        })
      }
    }
    
    return periodsList
  })()

  async function createTimetableEntry() {
    setMsg('')
    try {
      if (!selectedTerm || !selectedClass || !selectedSubject || !selectedTeacher || !selectedDay || !selectedPeriod) {
        setMsg('Vui lòng chọn đầy đủ thông tin')
        return
      }

      const payload = {
        term_id: Number(selectedTerm),
        class_id: Number(selectedClass),
        subject_id: Number(selectedSubject),
        teacher_user_id: Number(selectedTeacher),
        day_of_week: Number(selectedDay),
        period_index: Number(selectedPeriod)
      }

      await axios.post('/api/admin/timetable-entries', payload)
      setMsg('Tạo thời khóa biểu thành công')
      
      // Reset form
      setSelectedSubject('')
      setSelectedTeacher('')
      setSelectedDay('')
      setSelectedPeriod('')
      
      // Reload timetable entries
      const { data } = await axios.get('/api/admin/timetable-entries', {
        params: { term_id: selectedTerm, class_id: selectedClass }
      })
      setTimetableEntries(data)
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Tạo thời khóa biểu thất bại')
    }
  }

  async function deleteTimetableEntry(entryId) {
    if (!confirm('Xác nhận xóa tiết học này?')) return
    try {
      await axios.delete(`/api/admin/timetable-entries/${entryId}`)
      setMsg('Xóa tiết học thành công')
      
      // Reload timetable entries
      const { data } = await axios.get('/api/admin/timetable-entries', {
        params: { term_id: selectedTerm, class_id: selectedClass }
      })
      setTimetableEntries(data)
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Xóa tiết học thất bại')
    }
  }

  // Tạo ma trận thời khóa biểu
  function renderTimetableMatrix() {
    if (!selectedClass || !selectedTerm) {
      return <div>Vui lòng chọn học kỳ và lớp để xem thời khóa biểu</div>
    }

    const maxPeriods = Math.max(...availablePeriods.map(p => p.period_index), 5)
    
    return (
      <div className="timetable-matrix">
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Thứ</th>
              {Array.from({ length: maxPeriods }, (_, i) => (
                <th key={i + 1}>Tiết {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map(day => (
              <tr key={day.value}>
                <td className="day-header">{day.label}</td>
                {Array.from({ length: maxPeriods }, (_, i) => {
                  const periodIndex = i + 1
                  const entry = timetableEntries.find(entry => 
                    entry.day_of_week === day.value && entry.period_index === periodIndex
                  )
                  
                  const period = availablePeriods.find(p => p.period_index === periodIndex)
                  
                  return (
                    <td key={periodIndex} className="timetable-cell">
                      {entry ? (
                        <div className="entry">
                          <div className="subject">{entry.subject_name}</div>
                          <div className="teacher">{entry.teacher_name}</div>
                          <div className="time">
                            {period ? `${formatTime(period.start_time)} - ${formatTime(period.end_time)}` : ''}
                          </div>
                          <button 
                            className="delete-btn" 
                            onClick={() => deleteTimetableEntry(entry.id)}
                            title="Xóa tiết học"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="empty-slot">
                          <div className="time">
                            {period ? `${formatTime(period.start_time)} - ${formatTime(period.end_time)}` : ''}
                          </div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>Quản lý thời khóa biểu</h3>
      <div className="row mt16" />
      {msg && <div className="mt16">{msg}</div>}
      
      <div className="mt24">
        <div className="filter-chipbar">
          <button 
            className={`btn ${activeView==='create'?'primary':''}`} 
            onClick={()=>setActiveView('create')}
          >
            Tạo thời khóa biểu
          </button>
          <button 
            className={`btn ${activeView==='view'?'primary':''}`} 
            style={{marginLeft:8}} 
            onClick={()=>setActiveView('view')}
          >
            Xem thời khóa biểu
          </button>
        </div>
      </div>

      {activeView === 'create' && (
        <div className="mt24">
          <h4>Tạo tiết học mới</h4>
          <div className="row mt16">
            <select 
              className="input" 
              value={selectedLevel} 
              onChange={e=>{ setSelectedLevel(e.target.value); setSelectedTerm(''); setSelectedClass('') }}
            >
              <option value="">-- Chọn cấp học --</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedTerm} 
              onChange={e=>{ setSelectedTerm(e.target.value); setSelectedClass('') }}
              disabled={!selectedLevel}
            >
              <option value="">-- Chọn học kỳ --</option>
              {filteredTerms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedClass} 
              onChange={e=>{ setSelectedClass(e.target.value); setSelectedSubject('') }}
              disabled={!selectedTerm}
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => {
                const grade = grades.find(g => String(g.id) === String(c.grade_id))
                const level = levels.find(l => grade && String(l.id) === String(grade.level_id))
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} - Khối {grade?.grade_number || ''} - {level?.name || ''}
                  </option>
                )
              })}
            </select>
            
            
            <select 
              className="input" 
              value={selectedSubject} 
              onChange={e=>{ setSelectedSubject(e.target.value); setSelectedTeacher('') }}
              disabled={!selectedClass}
            >
              <option value="">-- Chọn môn học --</option>
              {filteredSubjects.length === 0 ? (
                <option value="" disabled>Chưa có môn học nào được gán cho khối này</option>
              ) : (
                filteredSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))
              )}
            </select>
            
            <select 
              className="input" 
              value={selectedTeacher} 
              onChange={e=>setSelectedTeacher(e.target.value)}
              disabled={!selectedSubject}
            >
              <option value="">-- Chọn giáo viên --</option>
              {filteredTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.username}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedDay} 
              onChange={e=>{ setSelectedDay(e.target.value); setSelectedPeriod('') }}
              disabled={!selectedTeacher}
            >
              <option value="">-- Chọn thứ --</option>
              {daysOfWeek.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedPeriod} 
              onChange={e=>setSelectedPeriod(e.target.value)}
              disabled={!selectedDay}
            >
              <option value="">-- Chọn tiết --</option>
              {availablePeriods.map(p => (
                <option key={p.period_index} value={p.period_index}>
                  Tiết {p.period_index} ({formatTime(p.start_time)} - {formatTime(p.end_time)})
                </option>
              ))}
            </select>
            
            <button 
              className="btn" 
              onClick={createTimetableEntry}
              disabled={!selectedPeriod}
            >
              Thêm tiết học
            </button>
          </div>
          
          {msg && <div className="msg">{msg}</div>}
          
          {/* Hiển thị thời khóa biểu của lớp đang tạo */}
          {selectedClass && selectedTerm && (
            <div className="mt24">
              <h4>Thời khóa biểu lớp đang tạo:</h4>
              {renderTimetableMatrix()}
            </div>
          )}
        </div>
      )}

      {activeView === 'view' && (
        <div className="mt24">
          <h4>Xem thời khóa biểu</h4>
          <div className="row mt16">
            <select 
              className="input" 
              value={selectedLevel} 
              onChange={e=>{ setSelectedLevel(e.target.value); setSelectedTerm(''); setSelectedClass('') }}
            >
              <option value="">-- Chọn cấp học --</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedTerm} 
              onChange={e=>{ setSelectedTerm(e.target.value); setSelectedClass('') }}
              disabled={!selectedLevel}
            >
              <option value="">-- Chọn học kỳ --</option>
              {filteredTerms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedClass} 
              onChange={e=>setSelectedClass(e.target.value)}
              disabled={!selectedTerm}
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map(c => {
                const grade = grades.find(g => String(g.id) === String(c.grade_id))
                const level = levels.find(l => grade && String(l.id) === String(grade.level_id))
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} - Khối {grade?.grade_number || ''} - {level?.name || ''}
                  </option>
                )
              })}
            </select>
          </div>
          
          <div className="mt24">
            {renderTimetableMatrix()}
          </div>
        </div>
      )}
    </div>
  )
}