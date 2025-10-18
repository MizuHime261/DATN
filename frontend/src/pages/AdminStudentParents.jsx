import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'

function genderBadge(gender){
  if (!gender) return <span className="gender-text">--</span>
  return <span className="gender-text">{gender}</span>
}

function formatDate(date){
  if (!date) return ''
  try{
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }catch(_err){
    return ''
  }
}

function InlineEditClass({ classes, studentId, currentClassName, onChanged }){
  const [editing, setEditing] = useState(false)
  const [classId, setClassId] = useState('')
  async function save(){
    if (!classId) { setEditing(false); return }
    await axios.post('/api/admin/students/assign-class', { student_id: Number(studentId), class_id: Number(classId) })
    setEditing(false)
    onChanged && onChanged()
  }
  if (!editing) return (
    <button className="btn secondary" onClick={()=> setEditing(true)}>Chỉnh lớp</button>
  )
  return (
    <div className="row" style={{gap:8}}>
      <select className="input" value={classId} onChange={e=>setClassId(e.target.value)}>
        <option value="">-- Chọn lớp --</option>
        {(classes||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn" onClick={save}>Lưu</button>
      <button className="btn secondary" onClick={()=> setEditing(false)}>Hủy</button>
    </div>
  )
}

export default function AdminStudentParents(){
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentGender, setStudentGender] = useState('')
  const [studentBirth, setStudentBirth] = useState('')
  const [selectedParent, setSelectedParent] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [relationship, setRelationship] = useState('BỐ')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [list, setList] = useState([])
  const [filters, setFilters] = useState({ level:'', className:'' })
  const [search, setSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [parentSearch, setParentSearch] = useState('')
  const [studentOpen, setStudentOpen] = useState(false)
  const [parentOpen, setParentOpen] = useState(false)
  const studentInputRef = useRef(null)
  const parentInputRef = useRef(null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')

  useEffect(()=>{
    async function fetchData(){
      try{
        const [studentsRes, parentsRes, classesRes] = await Promise.all([
          axios.get('/api/admin/students'),
          axios.get('/api/admin/users', { params:{ role:'PARENT' } }),
          axios.get('/api/admin/classes')
        ])
        setStudents(studentsRes.data || [])
        setParents(parentsRes.data || [])
        setClasses(classesRes.data || [])
        await refreshLinks()
      }catch(err){
        setError(err?.response?.data?.error || 'Không tải được dữ liệu')
      }
    }
    fetchData()
  }, [])

  async function refreshLinks(){
    try{
      const { data } = await axios.get('/api/admin/student-parent-links')
      setList(data || [])
    }catch(err){
      setError(err?.response?.data?.error || 'Không tải được danh sách liên kết')
    }
  }

  const levelOptions = useMemo(()=>{
    const levels = new Map()
    for (const row of list){
      if (row.level_name) levels.set(row.level_id, row.level_name)
    }
    return Array.from(levels.entries())
  }, [list])

  const classOptions = useMemo(()=>{
    const classes = new Set()
    for (const row of list){
      if (row.class_name) classes.add(row.class_name)
    }
    return Array.from(classes)
  }, [list])

  const filteredList = useMemo(()=>{
    const q = search.trim().toLowerCase()
    return list.filter(item => {
      if (filters.level && String(item.level_id) !== filters.level) return false
      if (filters.className && item.class_name !== filters.className) return false
      if (!q) return true
      return (
        (item.student_name || '').toLowerCase().includes(q) ||
        (item.parent_name || '').toLowerCase().includes(q) ||
        (item.parent_phone || '').toLowerCase().includes(q)
      )
    })
  }, [list, filters, search])

  const classOptionsFull = useMemo(()=>{
    return classes.map(cls => ({ value:String(cls.id), label:cls.name }))
  }, [classes])

  async function handleLink(){
    setError('')
    setSuccess('')
    if (!selectedStudent){ setError('Chọn học sinh trước'); return }
    if (!selectedClass){ setError('Chọn lớp học trước'); return }
    if (!selectedParent){ setError('Chọn phụ huynh trước'); return }
    setLoading(true)
    try{
      await axios.post('/api/admin/students/assign-parent', {
        student_id: Number(selectedStudent),
        parent_id: Number(selectedParent),
        relationship
      })
      await axios.post('/api/admin/students/assign-class', {
        student_id: Number(selectedStudent),
        class_id: Number(selectedClass)
      })
      setSuccess('Liên kết thành công')
      await refreshLinks()
    }catch(err){
      setError(err?.response?.data?.error || 'Không thể liên kết')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    const student = students.find(s => String(s.id) === selectedStudent)
    if (!student) {
      setStudentGender('')
      setStudentBirth('')
      setRelationship('BỐ')
      return
    }
    setStudentGender((student.gender || '').trim())
    setStudentBirth(student.birthdate ? String(student.birthdate) : '')
    const normalizedGender = (student.gender || '').trim().toLowerCase()
    if (normalizedGender === 'nữ' || normalizedGender === 'female' || normalizedGender === 'f') {
      setRelationship('MẸ')
    } else if (normalizedGender === 'nam' || normalizedGender === 'male' || normalizedGender === 'm') {
      setRelationship('BỐ')
    }
  }, [selectedStudent, students])

  useEffect(()=>{
    const parent = parents.find(p => String(p.id) === selectedParent)
    if (!parent) {
      setParentEmail('')
      return
    }
    setParentEmail((parent.email || '').trim())
  }, [selectedParent, parents])

  const studentOptions = useMemo(()=>{
    const linkedStudentIds = new Set(list.map(item => String(item.student_id)))
    return students
      .filter(s => !linkedStudentIds.has(String(s.id)))
      .map(s => ({ value: String(s.id), label: (s.username || 'Chưa đặt tên').trim() }))
  }, [students, list])

  const filteredStudentOptions = useMemo(()=>{
    const q = studentSearch.trim().toLowerCase()
    if (!q) return studentOptions
    return studentOptions.filter(opt => opt.label.toLowerCase().includes(q))
  }, [studentOptions, studentSearch])

  const filteredStudentDropdown = filteredStudentOptions.slice(0, 20)

  useEffect(()=>{
    if (!studentOpen) return
    const handleClick = (evt)=>{
      if (!studentInputRef.current) return
      if (!studentInputRef.current.parentElement?.contains(evt.target)) {
        setStudentOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return ()=> document.removeEventListener('mousedown', handleClick)
  }, [studentOpen])

  const studentGenderOptions = useMemo(()=>{
    const filtered = students.filter(s => String(s.id) === selectedStudent)
    return Array.from(new Map(filtered.map(s => [String(s.gender || ''), (s.gender || '').trim()])).entries())
      .filter(([key]) => key !== '')
      .map(([key, label]) => ({ value: key, label }))
  }, [students, selectedStudent])

  const studentBirthOptions = useMemo(()=>{
    const filtered = students.filter(s => String(s.id) === selectedStudent)
    const filteredByGender = studentGender
      ? filtered.filter(s => (s.gender || '').trim() === studentGender)
      : filtered
    return filteredByGender
      .filter(s => s.birthdate)
      .map(s => ({ value: String(s.birthdate), label: formatDate(s.birthdate) }))
  }, [students, selectedStudent, studentGender])

  const parentOptions = useMemo(()=>{
    return parents.map(p => ({ value: String(p.id), label: (p.username || p.email || '').trim() }))
  }, [parents])

  const filteredParentOptions = useMemo(()=>{
    const q = parentSearch.trim().toLowerCase()
    if (!q) return parentOptions
    return parentOptions.filter(opt => opt.label.toLowerCase().includes(q))
  }, [parentOptions, parentSearch])

  const filteredParentDropdown = filteredParentOptions.slice(0, 20)

  useEffect(()=>{
    if (!parentOpen) return
    const handleClick = (evt)=>{
      if (!parentInputRef.current) return
      if (!parentInputRef.current.parentElement?.contains(evt.target)) {
        setParentOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return ()=> document.removeEventListener('mousedown', handleClick)
  }, [parentOpen])

  const parentEmailOptions = useMemo(()=>{
    const filtered = parents.filter(p => String(p.id) === selectedParent)
    return filtered.map(p => ({ value: (p.email || '').trim(), label: (p.email || '').trim() }))
  }, [parents, selectedParent])

  return (
    <div className="link-card">
      <h3>Quản lý thông tin học sinh</h3>
      <div className="link-grid">
        <section className="link-section">
          <h4>Thông tin học sinh</h4>
          <div className="link-field">
            <label>Học sinh</label>
            <div style={{position:'relative'}}>
              <input
                ref={studentInputRef}
                className="input"
                placeholder="Gõ tên học sinh"
                value={studentSearch}
                onFocus={()=> setStudentOpen(true)}
                onChange={e=>{
                  setStudentSearch(e.target.value)
                  setStudentOpen(true)
                }}
              />
              <button
                type="button"
                className="icon-btn"
                style={{position:'absolute', right:6, top:6}}
                onMouseDown={e=>{
                  e.preventDefault()
                  setStudentOpen(prev=>!prev)
                  studentInputRef.current?.focus()
                }}
              >▼</button>
              {studentOpen && (
                <div className="card" style={{position:'absolute', top:'calc(100% + 4px)', left:0, right:0, maxHeight:220, overflowY:'auto', zIndex:40}}>
                  {filteredStudentDropdown.length === 0 ? (
                    <div className="input-help error" style={{padding:8}}>Không tìm thấy học sinh phù hợp</div>
                  ) : (
                    filteredStudentDropdown.map(option => (
                      <div
                        key={option.value}
                        style={{padding:'8px 10px', cursor:'pointer'}}
                        onMouseDown={e=>{
                          e.preventDefault()
                          setSelectedStudent(option.value)
                          setStudentSearch(option.label)
                          setStudentOpen(false)
                        }}
                      >
                        {option.label}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="link-field">
            <label>Giới tính</label>
            <div className="gender-display">
              {studentGender ? genderBadge(studentGender) : <span className="pill-placeholder">-- Chọn học sinh --</span>}
            </div>
          </div>
          <div className="link-field">
            <label>Ngày sinh</label>
            <select value={studentBirth} onChange={e=>setStudentBirth(e.target.value)}>
              <option value="">-- Chọn ngày sinh --</option>
              {studentBirthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="link-field">
            <label>Lớp học</label>
            <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
              <option value="">-- Chọn lớp --</option>
              {classOptionsFull.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </section>

        <section className="link-section">
          <h4>Thông tin phụ huynh</h4>
          <div className="link-field">
            <label>Phụ huynh</label>
            <div style={{position:'relative'}}>
              <input
                ref={parentInputRef}
                className="input"
                placeholder="Gõ tên phụ huynh"
                value={parentSearch}
                onFocus={()=> setParentOpen(true)}
                onChange={e=>{
                  setParentSearch(e.target.value)
                  setParentOpen(true)
                }}
              />
              <button
                type="button"
                className="icon-btn"
                style={{position:'absolute', right:6, top:6}}
                onMouseDown={e=>{
                  e.preventDefault()
                  setParentOpen(prev=>!prev)
                  parentInputRef.current?.focus()
                }}
              >▼</button>
              {parentOpen && (
                <div className="card" style={{position:'absolute', top:'calc(100% + 4px)', left:0, right:0, maxHeight:220, overflowY:'auto', zIndex:40}}>
                  {filteredParentDropdown.length === 0 ? (
                    <div className="input-help error" style={{padding:8}}>Không tìm thấy phụ huynh phù hợp</div>
                  ) : (
                    filteredParentDropdown.map(option => (
                      <div
                        key={option.value}
                        style={{padding:'8px 10px', cursor:'pointer'}}
                        onMouseDown={e=>{
                          e.preventDefault()
                          setSelectedParent(option.value)
                          setParentSearch(option.label)
                          setParentOpen(false)
                        }}
                      >
                        {option.label}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="link-field">
            <label>Email</label>
            <select value={parentEmail} onChange={e=>setParentEmail(e.target.value)}>
              <option value="">-- Chọn email phụ huynh --</option>
              {parentEmailOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="link-field">
            <label>Quan hệ</label>
            <select value={relationship} onChange={e=>setRelationship(e.target.value)}>
              <option value="BỐ">Bố</option>
              <option value="MẸ">Mẹ</option>
              <option value="ÔNG">Ông</option>
              <option value="BÀ">Bà</option>
              <option value="GIÁM HỘ">Giám hộ</option>
              <option value="KHÁC">Khác</option>
            </select>
          </div>
        </section>
      </div>

      {error && <div className="form-error--general">{error}</div>}
      {success && <div className="form-error--general" style={{background:'#ecfdf5',color:'#047857'}}> {success} </div>}

      <div className="link-actions">
        <button className="btn secondary" onClick={()=>{
          setSelectedStudent('')
          setStudentGender('')
          setStudentBirth('')
          setSelectedClass('')
          setParentEmail('')
          setSelectedParent('')
          setStudentSearch('')
          setParentSearch('')
          setRelationship('BỐ')
          setError('')
          setSuccess('')
        }}>Làm mới</button>
        <button className="btn" onClick={handleLink} disabled={loading}>{loading? 'Đang liên kết...':'Liên kết học sinh với phụ huynh'}</button>
      </div>

      <div className="divider" />

      <div className="filter-chipbar">
        <input className="input" style={{flex:'2 1 240px'}} placeholder="Tìm học sinh hoặc phụ huynh" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="input" value={filters.level} onChange={e=>setFilters(prev=>({ ...prev, level:e.target.value }))}>
          <option value="">Lọc theo cấp học</option>
          {levelOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select className="input" value={filters.className} onChange={e=>setFilters(prev=>({ ...prev, className:e.target.value }))}>
          <option value="">Lọc theo lớp</option>
          {classOptions.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="link-table">
        <table>
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Cấp học</th>
              <th>Lớp</th>
              <th>Phụ huynh</th>
              <th>Số điện thoại</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Chưa có dữ liệu liên kết</div>
                </td>
              </tr>
            )}
            {filteredList.map(row => (
              <tr key={`${row.student_id}-${row.parent_id}`}>
                <td>{row.student_name}</td>
                <td>{formatDate(row.birthdate)}</td>
                <td>{genderBadge(row.gender)}</td>
                <td>{row.level_name || ''}</td>
                <td>{row.class_name || ''}</td>
                <td>{row.parent_name || row.parent_email}</td>
                <td>
                  {row.parent_phone ? (
                    <span className="badge-phone">☎ {row.parent_phone}</span>
                  ) : 'Chưa có'}
                </td>
                <td>
                  <InlineEditClass
                    classes={classes}
                    studentId={row.student_id}
                    currentClassName={row.class_name}
                    onChanged={refreshLinks}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
