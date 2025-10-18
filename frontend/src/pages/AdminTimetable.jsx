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
  const [years, setYears] = useState([])
  
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  
  const [msg, setMsg] = useState('')
  const [activeView, setActiveView] = useState('create') // 'create' | 'view'
  const [editingEntry, setEditingEntry] = useState(null) // entry đang chỉnh sửa

  const daysOfWeek = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' }
  ]

  useEffect(()=>{ (async()=>{
    const [tm, cls, sub, tch, per, lv, grd, yr] = await Promise.all([
      axios.get('/api/admin/terms'),
      axios.get('/api/admin/classes'),
      axios.get('/api/admin/subjects'),
      axios.get('/api/admin/users?role=TEACHER'),
      axios.get('/api/admin/periods'),
      axios.get('/api/admin/levels'),
      axios.get('/api/admin/grades'),
      axios.get('/api/admin/school-years')
    ])
    setTerms(tm.data); setClasses(cls.data); setSubjects(sub.data); 
    setTeachers(tch.data); setPeriods(per.data); setLevels(lv.data); setGrades(grd.data); setYears(yr.data)
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

  // Filter grades theo level được chọn
  const filteredGrades = selectedLevel ? grades.filter(g => 
    String(g.level_id) === String(selectedLevel)
  ) : []

  // Filter years theo level được chọn
  const filteredYears = selectedLevel ? years.filter(year => 
    String(year.level_id) === String(selectedLevel)
  ) : []

  // Filter terms theo year được chọn
  const filteredTerms = selectedYear ? terms.filter(term => 
    String(term.school_year_id) === String(selectedYear)
  ) : []

  // Filter classes theo grade được chọn
  const filteredClasses = selectedGrade ? classes.filter(c => 
    String(c.grade_id) === String(selectedGrade)
  ) : []

  // Debug log để kiểm tra filtering
  console.log('Selected level:', selectedLevel)
  console.log('Selected grade:', selectedGrade)
  console.log('Selected year:', selectedYear)
  console.log('Filtered grades:', filteredGrades)
  console.log('Filtered years:', filteredYears)
  console.log('Filtered terms:', filteredTerms)
  console.log('Filtered classes:', filteredClasses)

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
    
    // Lấy max period_index của level này từ database
    const maxPeriods = levelPeriods.length > 0 ? Math.max(...levelPeriods.map(p => p.period_index)) : 9
    
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

      // Debug log
      console.log('Create timetable entry debug:', {
        availablePeriods,
        selectedPeriod,
        selectedDay,
        selectedClass,
        selectedLevel
      })

      // Kiểm tra xem tiết được chọn có tồn tại trong availablePeriods không
      const selectedPeriodExists = availablePeriods.some(p => p.period_index === Number(selectedPeriod))
      if (!selectedPeriodExists) {
        setMsg('Tiết học không tồn tại hoặc không khả dụng')
        return
      }

      // Kiểm tra tiết cố định - chỉ áp dụng cho cấp 1
      const isPrimaryLevel = selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('tiểu học') || 
                            selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('cấp 1')
      
      const isFixedPeriod = isPrimaryLevel && (
        (Number(selectedDay) === 1 && Number(selectedPeriod) === 1) || // Tiết 1 thứ 2 - Chào cờ
        (Number(selectedDay) === 5 && Number(selectedPeriod) === 7)    // Tiết 7 thứ 6 - Sinh hoạt lớp
      )
      
      if (isFixedPeriod) {
        setMsg('Không thể tạo tiết học ở vị trí cố định (Tiết 1 thứ 2: Chào cờ, Tiết 7 thứ 6: Sinh hoạt lớp) - Chỉ áp dụng cho cấp 1')
        return
      }

      // Không cần kiểm tra trùng lặp vì dropdown đã lọc ra những tiết đã có môn

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

  async function updateTimetableEntry() {
    setMsg('')
    try {
      if (!editingEntry) return
      if (!selectedTerm || !selectedClass || !selectedSubject || !selectedTeacher || !selectedDay || !selectedPeriod) {
        setMsg('Vui lòng chọn đầy đủ thông tin')
        return
      }

      // Debug log
      console.log('Update timetable entry debug:', {
        editingEntry,
        timetableEntries: timetableEntries.map(e => ({ id: e.id, day: e.day_of_week, period: e.period_index }))
      })

      // Kiểm tra xem entry có còn tồn tại trong danh sách không
      const entryStillExists = timetableEntries.find(entry => entry.id === editingEntry.id)
      if (!entryStillExists) {
        setMsg('Tiết học không tồn tại hoặc đã bị xóa. Vui lòng tải lại trang.')
        setEditingEntry(null)
        return
      }

      // Kiểm tra xem tiết được chọn có tồn tại trong availablePeriods không
      const selectedPeriodExists = availablePeriods.some(p => p.period_index === Number(selectedPeriod))
      if (!selectedPeriodExists) {
        setMsg('Tiết học không tồn tại hoặc không khả dụng')
        return
      }

      // Kiểm tra tiết cố định - chỉ áp dụng cho cấp 1
      const isPrimaryLevel = selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('tiểu học') || 
                            selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('cấp 1')
      
      const isFixedPeriod = isPrimaryLevel && (
        (Number(selectedDay) === 1 && Number(selectedPeriod) === 1) || // Tiết 1 thứ 2 - Chào cờ
        (Number(selectedDay) === 5 && Number(selectedPeriod) === 7)    // Tiết 7 thứ 6 - Sinh hoạt lớp
      )
      
      if (isFixedPeriod) {
        setMsg('Không thể chỉnh sửa tiết học ở vị trí cố định (Tiết 1 thứ 2: Chào cờ, Tiết 7 thứ 6: Sinh hoạt lớp) - Chỉ áp dụng cho cấp 1')
        return
      }

      // Không cần kiểm tra trùng lặp vì dropdown đã lọc ra những tiết đã có môn (trừ tiết hiện tại đang edit)
      const payload = {
        term_id: Number(selectedTerm),
        class_id: Number(selectedClass),
        subject_id: Number(selectedSubject),
        teacher_user_id: Number(selectedTeacher),
        day_of_week: Number(selectedDay),
        period_index: Number(selectedPeriod)
      }
      try {
        await axios.put(`/api/admin/timetable-entries/${editingEntry.id}`, payload)
        setMsg('Cập nhật tiết học thành công')
        setEditingEntry(null)
        const { data } = await axios.get('/api/admin/timetable-entries', {
          params: { term_id: selectedTerm, class_id: selectedClass }
        })
        setTimetableEntries(data)
      } catch (updateError) {
        console.error('Update error:', updateError)
        if (updateError.response?.status === 404) {
          setMsg('Tiết học không tồn tại hoặc đã bị xóa. Vui lòng tải lại trang.')
          setEditingEntry(null)
          // Reload timetable entries
          const { data } = await axios.get('/api/admin/timetable-entries', {
            params: { term_id: selectedTerm, class_id: selectedClass }
          })
          setTimetableEntries(data)
        } else {
          throw updateError
        }
      }
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Cập nhật tiết học thất bại')
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

    const maxPeriods = availablePeriods.length > 0 ? Math.max(...availablePeriods.map(p => p.period_index)) : 9
    
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
                  
                  // Kiểm tra tiết cố định - chỉ áp dụng cho cấp 1
                  const isPrimaryLevel = selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('tiểu học') || 
                                        selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('cấp 1')
                  
                  const isFixedPeriod = isPrimaryLevel && (
                    (day.value === 1 && periodIndex === 1) || // Tiết 1 thứ 2 - Chào cờ
                    (day.value === 5 && periodIndex === 7)    // Tiết 7 thứ 6 - Sinh hoạt lớp
                  )
                  
                  const entry = timetableEntries.find(entry => 
                    entry.day_of_week === day.value && entry.period_index === periodIndex
                  )
                  
                  const period = availablePeriods.find(p => p.period_index === periodIndex)
                  
                  return (
                    <td key={periodIndex} className="timetable-cell">
                      {isFixedPeriod ? (
                        <div className="entry fixed-period" style={{
                          backgroundColor: '#e8f4fd',
                          border: '2px solid #2196f3',
                          borderRadius: '4px',
                          padding: '8px',
                          textAlign: 'center'
                        }}>
                          <div className="subject" style={{ fontWeight: 'bold', color: '#1976d2' }}>
                            {day.value === 1 && periodIndex === 1 ? 'Chào cờ' : 'Sinh hoạt lớp'}
                          </div>
                          <div className="time">
                            {period ? `${formatTime(period.start_time)} - ${formatTime(period.end_time)}` : ''}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Tiết cố định
                          </div>
                        </div>
                      ) : entry ? (
                        <div className="entry">
                          <div className="subject">{entry.subject_name}</div>
                          <div className="teacher">{entry.teacher_name}</div>
                          <div className="time">
                            {period ? `${formatTime(period.start_time)} - ${formatTime(period.end_time)}` : ''}
                          </div>
                          <div className="row" style={{marginTop:4, gap:4}}>
                            <button
                              className="btn"
                              onClick={() => {
                                // Tự động chọn cấp/khối/năm/ky/lop theo entry để sửa
                                const cls = classes.find(c => String(c.id) === String(entry.class_id))
                                const grd = cls ? grades.find(g => String(g.id) === String(cls.grade_id)) : null
                                const lvlId = grd ? grd.level_id : ''
                                const term = terms.find(t => String(t.id) === String(entry.term_id))
                                const yearId = term ? term.school_year_id : ''
                                
                                if (lvlId) setSelectedLevel(String(lvlId))
                                if (grd) setSelectedGrade(String(grd.id))
                                if (yearId) setSelectedYear(String(yearId))
                                
                                setActiveView('create')
                                setSelectedTerm(String(entry.term_id))
                                setSelectedClass(String(entry.class_id))
                                setSelectedSubject(String(entry.subject_id))
                                setSelectedTeacher(String(entry.teacher_user_id))
                                setSelectedDay(String(entry.day_of_week))
                                setSelectedPeriod(String(entry.period_index))
                                setEditingEntry(entry)
                              }}
                              title="Chỉnh sửa tiết học"
                            >
                              Sửa
                            </button>
                            <button 
                              className="delete-btn" 
                              onClick={() => deleteTimetableEntry(entry.id)}
                              title="Xóa tiết học"
                            >
                              ✕
                            </button>
                          </div>
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
      {msg && (
        <div className="mt16">
          <div>{msg}</div>
          {msg.includes('không tồn tại') && (
            <button 
              className="btn" 
              style={{marginTop: '8px'}}
              onClick={async () => {
                try {
                  const { data } = await axios.get('/api/admin/timetable-entries', {
                    params: { term_id: selectedTerm, class_id: selectedClass }
                  })
                  setTimetableEntries(data)
                  setMsg('Đã tải lại dữ liệu')
                } catch (err) {
                  setMsg('Lỗi khi tải lại dữ liệu')
                }
              }}
            >
              Tải lại dữ liệu
            </button>
          )}
        </div>
      )}
      
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
          <h4>{editingEntry ? 'Chỉnh sửa tiết học' : 'Tạo tiết học mới'}</h4>
          <div className="row mt16">
            <select 
              className="input" 
              value={selectedLevel} 
              onChange={e=>{ 
                setSelectedLevel(e.target.value); 
                setSelectedGrade(''); 
                setSelectedYear(''); 
                setSelectedTerm(''); 
                setSelectedClass(''); 
                setSelectedSubject(''); 
                setSelectedTeacher(''); 
                setSelectedDay(''); 
                setSelectedPeriod('') 
              }}
            >
              <option value="">-- Chọn cấp học --</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedGrade} 
              onChange={e=>{ 
                setSelectedGrade(e.target.value); 
                setSelectedClass(''); 
                setSelectedSubject(''); 
                setSelectedTeacher(''); 
                setSelectedDay(''); 
                setSelectedPeriod('') 
              }}
              disabled={!selectedLevel}
            >
              <option value="">-- Chọn khối --</option>
              {filteredGrades.map(g => (
                <option key={g.id} value={g.id}>Khối {g.grade_number}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedClass} 
              onChange={e=>{ setSelectedClass(e.target.value); setSelectedSubject(''); setSelectedTeacher(''); setSelectedDay(''); setSelectedPeriod('') }}
              disabled={!selectedGrade}
            >
              <option value="">-- Chọn lớp --</option>
              {filteredClasses.map(c => {
                const grade = grades.find(g => String(g.id) === String(c.grade_id))
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} - Khối {grade?.grade_number || ''}
                  </option>
                )
              })}
            </select>
            
            <select 
              className="input" 
              value={selectedYear} 
              onChange={e=>{ 
                setSelectedYear(e.target.value); 
                setSelectedTerm(''); 
                setSelectedSubject(''); 
                setSelectedTeacher(''); 
                setSelectedDay(''); 
                setSelectedPeriod('') 
              }}
              disabled={!selectedLevel}
            >
              <option value="">-- Chọn năm học --</option>
              {filteredYears.map(y => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedTerm} 
              onChange={e=>{ setSelectedTerm(e.target.value); setSelectedSubject(''); setSelectedTeacher(''); setSelectedDay(''); setSelectedPeriod('') }}
              disabled={!selectedYear}
            >
              <option value="">-- Chọn học kỳ --</option>
              {filteredTerms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            
            
            <select 
              className="input" 
              value={selectedSubject} 
              onChange={e=>{ setSelectedSubject(e.target.value); setSelectedTeacher(''); setSelectedDay(''); setSelectedPeriod('') }}
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
              {daysOfWeek.map(d => {
                return (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                )
              })}
            </select>
            
            <select 
              className="input" 
              value={selectedPeriod} 
              onChange={e=>setSelectedPeriod(e.target.value)}
              disabled={!selectedDay}
            >
              <option value="">-- Chọn tiết --</option>
              {availablePeriods
                .filter(p => {
                  const isPrimaryLevel = selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('tiểu học') || 
                                      selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('cấp 1')
                  const isFixedPeriod = isPrimaryLevel && (
                    (Number(selectedDay) === 1 && p.period_index === 1) || // Tiết 1 thứ 2 - Chào cờ
                    (Number(selectedDay) === 5 && p.period_index === 7)    // Tiết 7 thứ 6 - Sinh hoạt lớp
                  )
                  
                  // Tìm tiết học đã được gán cho thứ và tiết này
                  const existingEntry = timetableEntries.find(entry => 
                    entry.day_of_week === Number(selectedDay) && entry.period_index === p.period_index
                  )
                  
                  // Nếu đang edit và tiết này là tiết hiện tại của entry đang edit, vẫn hiển thị
                  const isCurrentEditPeriod = editingEntry && 
                    editingEntry.day_of_week === Number(selectedDay) && 
                    editingEntry.period_index === p.period_index
                  
                  // Debug log
                  console.log('Period filter:', {
                    periodIndex: p.period_index,
                    selectedDay,
                    isFixedPeriod,
                    existingEntry: !!existingEntry,
                    isCurrentEditPeriod,
                    shouldShow: isFixedPeriod || !existingEntry || isCurrentEditPeriod
                  })
                  
                  // Chỉ hiển thị nếu:
                  // 1. Là tiết cố định (để hiển thị thông tin)
                  // 2. Chưa có môn học (existingEntry = null)
                  // 3. Hoặc đang edit tiết hiện tại
                  return isFixedPeriod || !existingEntry || isCurrentEditPeriod
                })
                .map(p => {
                  const isPrimaryLevel = selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('tiểu học') || 
                                      selectedLevel && levels.find(l => String(l.id) === String(selectedLevel))?.name?.toLowerCase().includes('cấp 1')
                  const isFixedPeriod = isPrimaryLevel && (
                    (Number(selectedDay) === 1 && p.period_index === 1) || // Tiết 1 thứ 2 - Chào cờ
                    (Number(selectedDay) === 5 && p.period_index === 7)    // Tiết 7 thứ 6 - Sinh hoạt lớp
                  )
                  
                  let displayText = `Tiết ${p.period_index} (${formatTime(p.start_time)} - ${formatTime(p.end_time)})`
                  
                  if (isFixedPeriod) {
                    displayText += p.period_index === 1 ? ' - Chào cờ (Cấp 1)' : ' - Sinh hoạt lớp (Cấp 1)'
                  }
                  
                  return (
                    <option key={p.period_index} value={p.period_index} disabled={isFixedPeriod}>
                      {displayText}
                    </option>
                  )
                })}
            </select>
            
            {editingEntry ? (
              <>
                <button 
                  className="btn"
                  onClick={updateTimetableEntry}
                  disabled={!selectedPeriod}
                >
                  Lưu thay đổi
                </button>
                <button 
                  className="btn"
                  style={{marginLeft:8}}
                  onClick={() => { setEditingEntry(null); setMsg('Đã hủy chỉnh sửa') }}
                >
                  Hủy
                </button>
              </>
            ) : (
              <button 
                className="btn" 
                onClick={createTimetableEntry}
                disabled={!selectedPeriod}
              >
                Thêm tiết học
              </button>
            )}
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
              onChange={e=>{ 
                setSelectedLevel(e.target.value); 
                setSelectedGrade(''); 
                setSelectedYear(''); 
                setSelectedTerm(''); 
                setSelectedClass(''); 
                setSelectedSubject(''); 
                setSelectedTeacher(''); 
                setSelectedDay(''); 
                setSelectedPeriod('') 
              }}
            >
              <option value="">-- Chọn cấp học --</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedGrade} 
              onChange={e=>{ 
                setSelectedGrade(e.target.value); 
                setSelectedClass(''); 
                setSelectedSubject(''); 
                setSelectedTeacher(''); 
                setSelectedDay(''); 
                setSelectedPeriod('') 
              }}
              disabled={!selectedLevel}
            >
              <option value="">-- Chọn khối --</option>
              {filteredGrades.map(g => (
                <option key={g.id} value={g.id}>Khối {g.grade_number}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedClass} 
              onChange={e=>setSelectedClass(e.target.value)}
              disabled={!selectedGrade}
            >
              <option value="">-- Chọn lớp --</option>
              {filteredClasses.map(c => {
                const grade = grades.find(g => String(g.id) === String(c.grade_id))
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} - Khối {grade?.grade_number || ''}
                  </option>
                )
              })}
            </select>
            
            <select 
              className="input" 
              value={selectedYear} 
              onChange={e=>{ 
                setSelectedYear(e.target.value); 
                setSelectedTerm(''); 
                setSelectedSubject(''); 
                setSelectedTeacher(''); 
                setSelectedDay(''); 
                setSelectedPeriod('') 
              }}
              disabled={!selectedLevel}
            >
              <option value="">-- Chọn năm học --</option>
              {filteredYears.map(y => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
            
            <select 
              className="input" 
              value={selectedTerm} 
              onChange={e=>{ setSelectedTerm(e.target.value); setSelectedSubject(''); setSelectedTeacher(''); setSelectedDay(''); setSelectedPeriod('') }}
              disabled={!selectedYear}
            >
              <option value="">-- Chọn học kỳ --</option>
              {filteredTerms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
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