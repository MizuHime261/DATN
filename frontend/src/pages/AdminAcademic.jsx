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

// Generate subject code from subject name (remove accents and spaces)
function generateSubjectCode(name) {
  if (!name) return ''
  
  // Remove accents
  const withoutAccents = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // Convert to lowercase and remove spaces
  const code = withoutAccents.toLowerCase().replace(/\s+/g, '')
  
  console.log('Generated code for "' + name + '": "' + code + '"')
  return code
}

export default function AdminAcademic(){
  const [subjects, setSubjects] = useState([])
  const [years, setYears] = useState([])
  const [terms, setTerms] = useState([])
  const [levels, setLevels] = useState([])
  const [grades, setGrades] = useState([])
  const [newSubject, setNewSubject] = useState({ code:'', name:'', level_id:'', grade_id:'' })
  const [assignLevel, setAssignLevel] = useState('')
  const [assignGrade, setAssignGrade] = useState('')
  const [assignSubject, setAssignSubject] = useState('')
  const [assignTeacher, setAssignTeacher] = useState('')
  const [assignTeachers, setAssignTeachers] = useState([])
  const [newYear, setNewYear] = useState({ level_id:'', name:'', start_date:'', end_date:'' })
  const [newTerm, setNewTerm] = useState({ school_year_id:'', name:'', term_order:'', start_date:'', end_date:'' })
  const [msg, setMsg] = useState('')
  const [activeList, setActiveList] = useState('terms') // 'years' | 'terms'
  const [subjectFilterLevel, setSubjectFilterLevel] = useState('') // Filter for subjects list

  useEffect(()=>{ (async()=>{
    const [lev, grd, sub, yr, tm] = await Promise.all([
      axios.get('/api/admin/levels'),
      axios.get('/api/admin/grades'),
      axios.get('/api/admin/subjects'),
      axios.get('/api/admin/school-years'),
      axios.get('/api/admin/terms')
    ])
    setLevels(lev.data); setGrades(grd.data); setSubjects(sub.data); setYears(yr.data); setTerms(tm.data)
  })() }, [])

  // load teachers theo cấp để gán môn
  useEffect(()=>{ (async()=>{
    if (!assignLevel){ setAssignTeachers([]); return }
    try{
      const { data } = await axios.get('/api/admin/teacher-levels', { params:{ level_id: assignLevel } })
      setAssignTeachers(data || [])
    }catch(_e){ setAssignTeachers([]) }
  })() }, [assignLevel])

  async function saveSubject(){
    setMsg('')
    try{
      const levelId = newSubject.level_id ? Number(newSubject.level_id) : null
      const gradeId = newSubject.grade_id ? Number(newSubject.grade_id) : null
      if (!newSubject.code || !newSubject.name || !levelId || !gradeId) {
        setMsg('Nhập đủ: mã, tên, cấp, khối')
        return
      }
      await axios.post('/api/admin/subjects', { code:newSubject.code, name:newSubject.name, level_id: levelId, grade_id: gradeId })
      setMsg('Lưu môn học OK')
      const { data } = await axios.get('/api/admin/subjects')
      setSubjects(data)
      setNewSubject({ code:'', name:'', level_id:'', grade_id:'' })
    }catch(err){
      const apiMsg = err?.response?.data?.error || 'Lưu môn học lỗi'
      setMsg(apiMsg)
    }
  }
  async function saveYear(){
    setMsg('')
    try{
      const payload = {
        level_id: newYear.level_id ? Number(newYear.level_id) : null,
        name: newYear.name,
        start_date: newYear.start_date,
        end_date: newYear.end_date
      }
      if (!payload.level_id || !payload.name || !payload.start_date || !payload.end_date){
        setMsg('Nhập đủ: cấp, tên năm học, ngày bắt đầu, ngày kết thúc')
        return
      }
      await axios.post('/api/admin/school-years', payload)
      setMsg('Lưu năm học OK')
      const { data } = await axios.get('/api/admin/school-years')
      setYears(data)
      setNewYear({ level_id:'', name:'', start_date:'', end_date:'' })
    }catch(err){ setMsg(err?.response?.data?.error || 'Lưu năm học lỗi') }
  }
  // Helper function để auto-set ngày bắt đầu khi chọn năm học
  function handleYearChange(schoolYearId) {
    setNewTerm(v => ({ ...v, school_year_id: schoolYearId }))
    
    if (schoolYearId) {
      const selectedYear = years.find(y => String(y.id) === String(schoolYearId))
      if (selectedYear) {
        // Tìm các học kỳ hiện có của năm học này
        const existingTerms = terms.filter(t => String(t.school_year_id) === String(schoolYearId))
        
        // Nếu là học kỳ đầu tiên và chưa có ngày bắt đầu, auto-set
        if (existingTerms.length === 0 && !newTerm.start_date) {
          setNewTerm(v => ({ ...v, start_date: selectedYear.start_date }))
        }
      }
    }
  }

  async function saveTerm(){ 
    setMsg('')
    try{ 
      // Tìm năm học được chọn
      const selectedYear = years.find(y => String(y.id) === String(newTerm.school_year_id))
      if (!selectedYear) {
        setMsg('Vui lòng chọn năm học')
        return
      }

      // Tìm các học kỳ hiện có của năm học này
      const existingTerms = terms.filter(t => String(t.school_year_id) === String(newTerm.school_year_id))
      const termCount = existingTerms.length
      
      let startDate = newTerm.start_date
      let endDate = newTerm.end_date

      // Nếu là học kỳ đầu tiên của năm học, set ngày bắt đầu = ngày bắt đầu năm học
      if (termCount === 0 && !startDate) {
        startDate = selectedYear.start_date
      }

      // Validation: Ngày kết thúc học kỳ không được vượt quá ngày kết thúc năm học
      if (endDate && selectedYear.end_date && new Date(endDate) >= new Date(selectedYear.end_date)) {
        setMsg(`Ngày kết thúc học kỳ không được vượt quá ngày kết thúc năm học (${formatDate(selectedYear.end_date)})`)
        return
      }

      // Validation: Ngày bắt đầu học kỳ không được trước ngày bắt đầu năm học
      if (startDate && new Date(startDate) < new Date(selectedYear.start_date)) {
        setMsg(`Ngày bắt đầu học kỳ không được trước ngày bắt đầu năm học (${formatDate(selectedYear.start_date)})`)
        return
      }

      // Validation: Kiểm tra xung đột thời gian với các học kỳ khác trong cùng năm học
      if (startDate && endDate && existingTerms.length > 0) {
        for (const existingTerm of existingTerms) {
          const existingStart = new Date(existingTerm.start_date)
          const existingEnd = new Date(existingTerm.end_date)
          const newStart = new Date(startDate)
          const newEnd = new Date(endDate)

          // Kiểm tra xung đột: thời gian mới có giao với thời gian hiện có không
          const hasOverlap = (newStart < existingEnd && newEnd > existingStart)
          
          if (hasOverlap) {
            setMsg(`Thời gian học kỳ bị trùng với học kỳ "${existingTerm.name}" (${formatDate(existingTerm.start_date)} - ${formatDate(existingTerm.end_date)})`)
            return
          }
        }
      }

      const payload = {
        ...newTerm,
        start_date: startDate,
        end_date: endDate,
        term_order: Number(newTerm.term_order || (termCount + 1))
      }

      await axios.post('/api/admin/terms', payload)
      setMsg('Lưu học kỳ OK')
      const { data } = await axios.get('/api/admin/terms')
      setTerms(data)
      setNewTerm({ school_year_id:'', name:'', term_order:'', start_date:'', end_date:'' })
    }catch(err){ 
      setMsg(err?.response?.data?.error || 'Lưu học kỳ lỗi') 
    } 
  }

  return (
    <div className="user-page">
      <div className="card user-top-card">
        <h3>Quản lý học vụ</h3>
        
        {msg && <div className="user-alert user-alert--success">{msg}</div>}
        
        <div className="user-form-grid">
          <div className="user-form-section">
            <h4>Môn học</h4>
            <div className="field">
              <label className="field-label">Tên môn</label>
              <input className="input" placeholder="Tên môn (name)" value={newSubject.name} onChange={e=>{
                const name = e.target.value
                const code = generateSubjectCode(name)
                setNewSubject(v=>({...v,name, code}))
              }} />
            </div>
            <div className="field">
              <label className="field-label">Cấp học</label>
              <select className="input" value={newSubject.level_id} onChange={e=>setNewSubject(v=>({...v,level_id:e.target.value, grade_id:''}))}>
                <option value="">-- Chọn cấp --</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Khối</label>
              <select className="input" value={newSubject.grade_id} onChange={e=>setNewSubject(v=>({...v,grade_id:e.target.value}))} disabled={!newSubject.level_id}>
                <option value="">-- Chọn khối --</option>
                {grades.filter(g => !newSubject.level_id || String(g.level_id)===String(newSubject.level_id)).map(g => (
                  <option key={g.id} value={g.id}>Khối {g.grade_number}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="user-form-section">
            <h4>Gán giáo viên cho môn học</h4>
            <div className="field">
              <label className="field-label">Cấp học</label>
              <select className="input" value={assignLevel} onChange={e=>{ setAssignLevel(e.target.value); setAssignGrade(''); setAssignSubject(''); setAssignTeacher('') }}>
                <option value="">-- Chọn cấp --</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Khối</label>
              <select className="input" value={assignGrade} onChange={e=>{ setAssignGrade(e.target.value); setAssignSubject(''); setAssignTeacher('') }} disabled={!assignLevel}>
                <option value="">-- Chọn khối --</option>
                {grades.filter(g => String(g.level_id)===String(assignLevel)).map(g => (
                  <option key={g.id} value={g.id}>Khối {g.grade_number}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Môn học</label>
              <select className="input" value={assignSubject} onChange={e=>setAssignSubject(e.target.value)} disabled={!assignLevel}>
                <option value="">-- Chọn môn --</option>
                {subjects
                  .filter(s => String(s.level_id||'')===String(assignLevel))
                  .map(s => {
                    const grade = grades.find(g => String(g.id) === String(s.grade_id))
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} {grade ? `(Khối ${grade.grade_number})` : ''}
                      </option>
                    )
                  })}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Giáo viên</label>
              <select className="input" value={assignTeacher} onChange={e=>setAssignTeacher(e.target.value)} disabled={!assignSubject}>
                <option value="">-- Chọn giáo viên --</option>
                {assignTeachers.map(t => (
                  <option key={`${t.teacher_id}-${t.level_id}`} value={t.teacher_id}>{t.teacher_name} ({t.teacher_email})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="user-form-section">
            <h4>Năm học</h4>
            <div className="field">
              <label className="field-label">Cấp học</label>
              <select className="input" value={newYear.level_id} onChange={e=>setNewYear(v=>({...v,level_id:e.target.value}))}>
                <option value="">-- Chọn cấp --</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Tên năm học</label>
              <input className="input" placeholder="Tên năm học" value={newYear.name} onChange={e=>setNewYear(v=>({...v,name:e.target.value}))} />
            </div>
            <div className="field">
              <label className="field-label">Ngày bắt đầu</label>
              <input className="input" type="date" value={newYear.start_date} onChange={e=>setNewYear(v=>({...v,start_date:e.target.value}))} />
            </div>
            <div className="field">
              <label className="field-label">Ngày kết thúc</label>
              <input className="input" type="date" value={newYear.end_date} onChange={e=>setNewYear(v=>({...v,end_date:e.target.value}))} />
            </div>
          </div>

          <div className="user-form-section">
            <h4>Học kỳ</h4>
            <div className="field">
              <label className="field-label">Năm học</label>
              <select className="input" value={newTerm.school_year_id} onChange={e=>handleYearChange(e.target.value)}>
                <option value="">-- Chọn năm học --</option>
                {years.map(y => {
                  const lv = levels.find(l => String(l.id) === String(y.level_id))
                  return (
                    <option key={y.id} value={y.id}>{y.name} - {lv ? lv.name : ''}</option>
                  )
                })}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Tên học kỳ</label>
              <input className="input" placeholder="Tên học kỳ" value={newTerm.name} onChange={e=>setNewTerm(v=>({...v,name:e.target.value}))} />
            </div>
            <div className="field">
              <label className="field-label">Thứ tự</label>
              <input className="input" placeholder="Thứ tự học kỳ" value={newTerm.term_order} onChange={e=>setNewTerm(v=>({...v,term_order:e.target.value}))} />
            </div>
            <div className="field">
              <label className="field-label">Ngày bắt đầu</label>
              <input className="input" type="date" value={newTerm.start_date} onChange={e=>setNewTerm(v=>({...v,start_date:e.target.value}))} />
            </div>
            <div className="field">
              <label className="field-label">Ngày kết thúc</label>
              <input className="input" type="date" value={newTerm.end_date} onChange={e=>setNewTerm(v=>({...v,end_date:e.target.value}))} />
            </div>
          </div>
        </div>

        <div className="user-actions">
          <button className="btn" onClick={saveSubject} disabled={!newSubject.level_id || !newSubject.grade_id}>Thêm môn</button>
          <button className="btn" onClick={async()=>{
            if (!assignSubject || !assignTeacher){ setMsg('Chọn đủ môn và giáo viên'); return }
            try{
              await axios.post('/api/admin/teacher-subjects', { teacher_user_id: Number(assignTeacher), subject_id: Number(assignSubject) })
              setMsg('Gán giáo viên thành công')
            }catch(err){ setMsg(err?.response?.data?.error || 'Gán giáo viên thất bại') }
          }}>Gán giáo viên</button>
          <button className="btn" onClick={saveYear}>Thêm năm học</button>
          <button className="btn" onClick={saveTerm}>Thêm học kỳ</button>
        </div>
      </div>

      <div className="card user-list-card">
        <div className="row" style={{justifyContent:'flex-start', flexWrap:'wrap'}}>
          <button className={`btn ${activeList==='terms'?'primary':''}`} onClick={()=>setActiveList('terms')}>Học kỳ</button>
          <button className={`btn ${activeList==='years'?'primary':''}`} onClick={()=>setActiveList('years')}>Năm học</button>
          <button className={`btn ${activeList==='subjects'?'primary':''}`} onClick={()=>setActiveList('subjects')}>Môn học</button>
        </div>
        <div className="mt16" style={{minHeight:200}}>
          <h3 style={{marginTop:0}}>{activeList? (activeList==='subjects'? 'Danh sách môn học' : activeList==='years'? 'Danh sách năm học' : 'Danh sách học kỳ') : 'Chọn danh mục để xem'}</h3>
          {activeList==='subjects' && (
            <div className="row" style={{marginBottom: '16px', alignItems: 'center'}}>
              <label style={{marginRight: '8px', fontWeight: 'bold'}}>Lọc theo cấp:</label>
              <select className="input" value={subjectFilterLevel} onChange={e=>setSubjectFilterLevel(e.target.value)} style={{width: '200px'}}>
                <option value="">-- Tất cả cấp --</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
          {activeList==='subjects' && (
            <div className="table-responsive">
              <table className="mt16">
                <thead><tr><th>Tên môn</th><th>Cấp</th><th>Khối</th><th>Giáo viên</th><th></th></tr></thead>
                <tbody>
                  {subjects
                    .filter(s => !subjectFilterLevel || String(s.level_id) === String(subjectFilterLevel))
                    .length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                        {subjectFilterLevel ? 'Không có môn học nào thuộc cấp được chọn' : 'Chưa có môn học nào'}
                      </td>
                    </tr>
                  ) : (
                    subjects
                      .filter(s => !subjectFilterLevel || String(s.level_id) === String(subjectFilterLevel))
                      .map(s => (
                      <SubjectRow key={s.id} s={s} levels={levels} grades={grades} onReload={async()=>{ const { data } = await axios.get('/api/admin/subjects'); setSubjects(data) }} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {activeList==='years' && (
            <div className="table-responsive">
              <table className="mt16">
                <thead><tr><th>Năm học</th><th>Cấp</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th></th></tr></thead>
                <tbody>
                  {years.map(y => (
                    <YearRow key={y.id} y={y} levels={levels} onReload={async()=>{ const { data } = await axios.get('/api/admin/school-years'); setYears(data) }} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeList==='terms' && (
            <div className="table-responsive">
              <table className="mt16">
                <thead><tr><th>Năm học</th><th>Học kỳ</th><th>Cấp</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th></th></tr></thead>
                <tbody>
                  {terms.map(t => (
                    <TermRow key={t.id} t={t} years={years} levels={levels} onReload={async()=>{ const { data } = await axios.get('/api/admin/terms'); setTerms(data) }} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function YearRow({ y, levels, onReload }){
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(y.name || '')
  const [levelId, setLevelId] = useState(String(y.level_id || ''))
  const [startDate, setStartDate] = useState(y.start_date || '')
  const [endDate, setEndDate] = useState(y.end_date || '')

  async function save(){
    try{
      const payload = { 
        name, 
        level_id: levelId ? Number(levelId) : null, 
        start_date: startDate, 
        end_date: endDate 
      }
      await axios.put(`/api/admin/school-years/${y.id}`, payload)
      setEditing(false)
      await onReload()
    }catch(err){
      const apiMsg = err?.response?.data?.error || 'Cập nhật năm học lỗi'
      alert(apiMsg)
    }
  }
  async function remove(){
    if (!confirm('Xác nhận xóa năm học này?')) return
    await axios.delete(`/api/admin/school-years/${y.id}`)
    await onReload()
  }

  if (!editing) return (
    <tr>
      <td>{y.name}</td>
      <td>{(levels.find(l=> String(l.id)===String(y.level_id))||{}).name || ''}</td>
      <td>{formatDate(y.start_date)}</td>
      <td>{formatDate(y.end_date)}</td>
      <td>
        <button className="icon-btn" onClick={()=>setEditing(true)}>✏️</button>
        <button className="icon-btn" style={{marginLeft:8}} onClick={remove}>🗑️</button>
      </td>
    </tr>
  )

  return (
    <tr>
      <td><input className="input" value={name} onChange={e=>setName(e.target.value)} /></td>
      <td>
        <select className="input" value={levelId} onChange={e=>setLevelId(e.target.value)}>
          <option value="">-- Chọn cấp --</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </td>
      <td><input className="input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></td>
      <td><input className="input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></td>
      <td>
        <button className="btn" onClick={save}>Lưu</button>
        <button className="btn secondary" style={{marginLeft:8}} onClick={()=>setEditing(false)}>Hủy</button>
      </td>
    </tr>
  )
}

function TermRow({ t, years, levels, onReload }){
  const [editing, setEditing] = useState(false)
  const [schoolYearId, setSchoolYearId] = useState(String(t.school_year_id || ''))
  const [name, setName] = useState(t.name || '')
  const [termOrder, setTermOrder] = useState(String(t.term_order || ''))
  const [startDate, setStartDate] = useState(t.start_date || '')
  const [endDate, setEndDate] = useState(t.end_date || '')

  async function save(){
    try{
      // Tìm năm học được chọn
      const selectedYear = years.find(y => String(y.id) === String(schoolYearId))
      if (!selectedYear) {
        alert('Vui lòng chọn năm học')
        return
      }

      // Validation: Ngày kết thúc học kỳ không được vượt quá ngày kết thúc năm học
      if (endDate && selectedYear.end_date && new Date(endDate) >= new Date(selectedYear.end_date)) {
        alert(`Ngày kết thúc học kỳ không được vượt quá ngày kết thúc năm học (${formatDate(selectedYear.end_date)})`)
        return
      }

      // Validation: Ngày bắt đầu học kỳ không được trước ngày bắt đầu năm học
      if (startDate && new Date(startDate) < new Date(selectedYear.start_date)) {
        alert(`Ngày bắt đầu học kỳ không được trước ngày bắt đầu năm học (${formatDate(selectedYear.start_date)})`)
        return
      }

      // Validation: Kiểm tra xung đột thời gian với các học kỳ khác trong cùng năm học (trừ học kỳ hiện tại)
      if (startDate && endDate) {
        const otherTerms = terms.filter(term => 
          String(term.school_year_id) === String(schoolYearId) && 
          String(term.id) !== String(t.id) // Loại trừ học kỳ đang chỉnh sửa
        )
        
        for (const otherTerm of otherTerms) {
          const otherStart = new Date(otherTerm.start_date)
          const otherEnd = new Date(otherTerm.end_date)
          const newStart = new Date(startDate)
          const newEnd = new Date(endDate)

          // Kiểm tra xung đột: thời gian mới có giao với thời gian hiện có không
          const hasOverlap = (newStart < otherEnd && newEnd > otherStart)
          
          if (hasOverlap) {
            alert(`Thời gian học kỳ bị trùng với học kỳ "${otherTerm.name}" (${formatDate(otherTerm.start_date)} - ${formatDate(otherTerm.end_date)})`)
            return
          }
        }
      }

      const payload = { 
        school_year_id: schoolYearId ? Number(schoolYearId) : null,
        name, 
        term_order: termOrder ? Number(termOrder) : null, 
        start_date: startDate, 
        end_date: endDate 
      }
      await axios.put(`/api/admin/terms/${t.id}`, payload)
      setEditing(false)
      await onReload()
    }catch(err){
      const apiMsg = err?.response?.data?.error || 'Cập nhật học kỳ lỗi'
      alert(apiMsg)
    }
  }
  async function remove(){
    if (!confirm('Xác nhận xóa học kỳ này?')) return
    await axios.delete(`/api/admin/terms/${t.id}`)
    await onReload()
  }

  const year = years.find(yy => String(yy.id)===String(t.school_year_id)) || {}
  const lv = levels.find(l=> String(l.id)===String(year.level_id))

  if (!editing) return (
    <tr>
      <td>{year.name || ''}</td>
      <td>{t.name}</td>
      <td>{lv? lv.name: ''}</td>
      <td>{formatDate(t.start_date)}</td>
      <td>{formatDate(t.end_date)}</td>
      <td>
        <button className="icon-btn" onClick={()=>setEditing(true)}>✏️</button>
        <button className="icon-btn" style={{marginLeft:8}} onClick={remove}>🗑️</button>
      </td>
    </tr>
  )

  return (
    <tr>
      <td>
        <select className="input" value={schoolYearId} onChange={e=>setSchoolYearId(e.target.value)}>
          <option value="">-- Chọn năm học --</option>
          {years.map(y => {
            const lv = levels.find(l => String(l.id) === String(y.level_id))
            return (
              <option key={y.id} value={y.id}>{y.name} - {lv ? lv.name : ''}</option>
            )
          })}
        </select>
      </td>
      <td><input className="input" value={name} onChange={e=>setName(e.target.value)} /></td>
      <td>{lv? lv.name: ''}</td>
      <td><input className="input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></td>
      <td><input className="input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></td>
      <td>
        <button className="btn" onClick={save}>Lưu</button>
        <button className="btn secondary" style={{marginLeft:8}} onClick={()=>setEditing(false)}>Hủy</button>
      </td>
    </tr>
  )
}

function SubjectRow({ s, levels, grades, onReload }){
  const [editing, setEditing] = useState(false)
  const [code, setCode] = useState(s.code || '')
  const [name, setName] = useState(s.name || '')
  const [levelId, setLevelId] = useState(String(s.level_id || ''))
  const [gradeId, setGradeId] = useState(String(s.grade_id || ''))
  const [teachers, setTeachers] = useState([])
  const [loadingT, setLoadingT] = useState(false)

  useEffect(()=>{ (async()=>{
    try{
      setLoadingT(true)
      // nếu có API teacher-subjects, có thể trả rỗng nếu chưa phân công
      try{
        const { data } = await axios.get('/api/admin/teacher-subjects', { params:{ subject_id: s.id } })
        setTeachers(data || [])
      }catch(_e){ setTeachers([]) }
    }finally{ setLoadingT(false) }
  })() }, [s.id])

  async function save(){
    try{
      const generatedCode = generateSubjectCode(name)
      const payload = { code: generatedCode, name, level_id: levelId ? Number(levelId) : null, grade_id: gradeId ? Number(gradeId) : null }
      await axios.put(`/api/admin/subjects/${s.id}`, payload)
      setEditing(false)
      await onReload()
    }catch(err){
      const apiMsg = err?.response?.data?.error || 'Cập nhật môn học lỗi'
      alert(apiMsg)
    }
  }
  async function remove(){
    if (!confirm('Xác nhận xóa môn học này?')) return
    await axios.delete(`/api/admin/subjects/${s.id}`)
    await onReload()
  }

  const grade = grades.find(g=> String(g.id)===String(gradeId || s.grade_id)) || {}
  const gradeLabel = grade.grade_number ? `Khối ${grade.grade_number}` : ''

  if (!editing) return (
    <tr>
      <td>{s.name}</td>
      <td>{(levels.find(l=> String(l.id)===String(s.level_id))||{}).name || ''}</td>
      <td>{gradeLabel}</td>
      <td>{loadingT? '...' : (teachers.map(t => t.teacher_name).join(', ') || '')}</td>
      <td>
        <button className="icon-btn" onClick={()=>setEditing(true)}>✏️</button>
        <button className="icon-btn" style={{marginLeft:8}} onClick={remove}>🗑️</button>
      </td>
    </tr>
  )

  return (
    <tr>
      <td><input className="input" value={name} onChange={e=>setName(e.target.value)} /></td>
      <td>
        <select className="input" value={levelId} onChange={e=>{ setLevelId(e.target.value); setGradeId('') }}>
          <option value="">-- Chọn cấp --</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </td>
      <td>
        <select className="input" value={gradeId} onChange={e=>setGradeId(e.target.value)}>
          <option value="">-- Chọn khối --</option>
          {grades.filter(g => !levelId || String(g.level_id)===String(levelId)).map(g => (
            <option key={g.id} value={g.id}>Khối {g.grade_number}</option>
          ))}
        </select>
      </td>
      <td>{loadingT? '...' : (teachers.map(t => t.teacher_name).join(', ') || '')}</td>
      <td>
        <button className="btn" onClick={save}>Lưu</button>
        <button className="btn secondary" style={{marginLeft:8}} onClick={()=>setEditing(false)}>Hủy</button>
      </td>
    </tr>
  )
}


