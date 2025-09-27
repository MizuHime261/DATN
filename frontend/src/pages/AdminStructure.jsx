import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function AdminStructure(){
  const [levels, setLevels] = useState([])
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [teacherLevels, setTeacherLevels] = useState([])
  const [teachers, setTeachers] = useState([])
  const [newLevel, setNewLevel] = useState({ code:'', name:'', sort_order:'' })
  const [newGrade, setNewGrade] = useState({ level_id:'', grade_number:'' })
  const [newClass, setNewClass] = useState({ grade_id:'', name:'', homeroom_teacher_id:'', room_name:'', active:true })
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('') // 'success' | 'error'
  const [errorsLevel, setErrorsLevel] = useState({})
  const [errorsGrade, setErrorsGrade] = useState({})
  const [errorsClass, setErrorsClass] = useState({})

  // Right panel state (like AdminUsers)
  const [activeTab, setActiveTab] = useState('') // 'LEVELS' | 'GRADES' | 'CLASSES'
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(()=>{ (async()=>{
    const [lev, gra, cla, tl, te] = await Promise.all([
      axios.get('/api/admin/levels'),
      axios.get('/api/admin/grades'),
      axios.get('/api/admin/classes'),
      axios.get('/api/admin/teacher-levels').catch(()=>({ data:[] })),
      axios.get('/api/admin/users', { params: { role:'TEACHER' } }).catch(()=>({ data:[] }))
    ])
    setLevels(lev.data); setGrades(gra.data); setClasses(cla.data); setTeacherLevels(tl.data||[]); setTeachers(te.data||[])
  })() }, [])

  function reload(tab){
    if (tab === 'LEVELS') axios.get('/api/admin/levels').then(r=>setLevels(r.data))
    if (tab === 'GRADES') axios.get('/api/admin/grades').then(r=>setGrades(r.data))
    if (tab === 'CLASSES') axios.get('/api/admin/classes').then(r=>setClasses(r.data))
    // always refresh teacher mapping to support GVCN selection
    Promise.all([
      axios.get('/api/admin/teacher-levels').then(r=>setTeacherLevels(r.data)).catch(()=>{}),
      axios.get('/api/admin/users', { params: { role:'TEACHER' } }).then(r=>setTeachers(r.data)).catch(()=>{})
    ])
  }

  // Reset paging/search when switching tab
  useEffect(()=>{ setCurrentPage(1); setSearchQuery('') }, [activeTab])

  async function saveLevel(){
    // Frontend validation: không trùng mã hoặc tên cấp
    const nextErrors = {}
    if (!String(newLevel.code||'').trim()) nextErrors.code = 'Nhập mã cấp'
    if (!String(newLevel.name||'').trim()) nextErrors.name = 'Nhập tên cấp'
    if (!String(newLevel.sort_order||'').trim()) nextErrors.sort_order = 'Nhập thứ tự'
    const existsCode = (levels||[]).some(l => String(l.code||'').toLowerCase().trim() === String(newLevel.code||'').toLowerCase().trim())
    if (existsCode) nextErrors.code = 'Mã cấp đã tồn tại'
    const existsName = (levels||[]).some(l => String(l.name||'').toLowerCase().trim() === String(newLevel.name||'').toLowerCase().trim())
    if (existsName) nextErrors.name = 'Tên cấp đã tồn tại'
    setErrorsLevel(nextErrors)
    if (Object.keys(nextErrors).length) return
    
    try {
      const nextId = (levels || []).reduce((m,l)=> Math.max(m, Number(l.id)||0), 0) + 1
      await axios.post('/api/admin/levels', { id: nextId, code: newLevel.code, name: newLevel.name, sort_order: Number(newLevel.sort_order||0) })
      setMsg('Thêm cấp học OK')
      setMsgType('success')
      setNewLevel({ code:'', name:'', sort_order:'' })
      setErrorsLevel({})
      reload('LEVELS')
    } catch {
      setMsg('Thêm cấp học lỗi'); setMsgType('error')
    }
  }
  async function saveGrade(){
    // Frontend validation: không trùng (level_id, grade_number)
    const nextErrors = {}
    if (!String(newGrade.level_id||'').trim()) nextErrors.level_id = 'Chọn cấp học'
    if (!String(newGrade.grade_number||'').trim()) nextErrors.grade_number = 'Nhập số khối'
    const exists = (grades||[]).some(g => String(g.level_id) === String(newGrade.level_id) && Number(g.grade_number) === Number(newGrade.grade_number))
    if (exists) nextErrors.grade_number = 'Khối này đã tồn tại trong cấp đã chọn'
    setErrorsGrade(nextErrors)
    if (Object.keys(nextErrors).length) return
    
    try {
      await axios.post('/api/admin/grades', { level_id:newGrade.level_id, grade_number:Number(newGrade.grade_number||0) });
      setMsg('Lưu khối OK')
      setMsgType('success')
      setErrorsGrade({})
    } catch {
      setMsg('Lưu khối lỗi'); setMsgType('error')
    }
  }
  async function saveClass(){
    const nextErrors = {}
    if (!String(newClass.grade_id||'').trim()) nextErrors.grade_id = 'Chọn khối'
    
    // Validate class name format and uniqueness
    const className = String(newClass.name||'').trim()
    if (!className) {
      nextErrors.name = 'Nhập tên lớp'
    } else {
      // Check format: sốAsố (e.g., 1A1, 10A2, 12A3)
      const formatRegex = /^\d+A\d+$/
      if (!formatRegex.test(className)) {
        nextErrors.name = 'Tên lớp phải có định dạng sốAsố (ví dụ: 1A1, 10A2)'
      } else {
        // Check for duplicates
        const existingClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase())
        if (existingClass) {
          nextErrors.name = 'Tên lớp đã tồn tại'
        }
      }
    }
    
    // Validate room name
    const roomName = String(newClass.room_name||'').trim()
    if (!roomName) {
      nextErrors.room_name = 'Nhập phòng học'
    } else {
      // Check for duplicate room names
      const existingRoom = classes.find(c => c.room_name && c.room_name.toLowerCase() === roomName.toLowerCase())
      if (existingRoom) {
        nextErrors.room_name = 'Phòng học này đã được sử dụng'
      }
    }
    setErrorsClass(nextErrors)
    if (Object.keys(nextErrors).length) return
    
    try {
      await axios.post('/api/admin/classes', { ...newClass, active: !!newClass.active });
      setMsg('Lưu lớp OK'); setMsgType('success'); setErrorsClass({})
    } catch {
      setMsg('Lưu lớp lỗi'); setMsgType('error')
    }
  }

  return (
    <div className="row" style={{alignItems:'flex-start'}}>
      <div className="card" style={{width:420, maxWidth:'100%'}}>
        <h3>Quản lý cơ cấu tổ chức</h3>
        
        {msg && (
          <div className={`mt16 input-help${msgType==='error'? ' error':''}`} style={{fontSize:14}}>
            {msg}
          </div>
        )}
        <div className="mt24">
          <h4>Cấp học</h4>
          <div className="mt16">
            <div className="mt16">
              <input className={`input${errorsLevel.code? ' input-error':''}`} placeholder="Mã (vd: PRIMARY, THCS, THPT)" value={newLevel.code} onChange={e=>setNewLevel(v=>({...v,code:e.target.value}))} />
              {errorsLevel.code && <div className="input-help error">{errorsLevel.code}</div>}
            </div>
            <div className="mt16">
              <input className={`input${errorsLevel.name? ' input-error':''}`} placeholder="Tên cấp" value={newLevel.name} onChange={e=>setNewLevel(v=>({...v,name:e.target.value}))} />
              {errorsLevel.name && <div className="input-help error">{errorsLevel.name}</div>}
            </div>
            <div className="mt16">
              <input className={`input${errorsLevel.sort_order? ' input-error':''}`} placeholder="Thứ tự xuất hiện" value={newLevel.sort_order} onChange={e=>setNewLevel(v=>({...v,sort_order:e.target.value}))} />
              {errorsLevel.sort_order && <div className="input-help error">{errorsLevel.sort_order}</div>}
            </div>
            <div className="mt16"><button className="btn" onClick={saveLevel}>Thêm cấp</button></div>
          </div>
        </div>
        
        <div className="mt24">
          <h4>Khối lớp</h4>
          <div className="mt16">
            <div className="row">
              <select className={`input${errorsGrade.level_id? ' input-error':''}`} value={newGrade.level_id} onChange={e=>setNewGrade(v=>({...v,level_id:e.target.value}))} style={{flex:1}}>
                <option value="" disabled>Cấp</option>
                {levels.sort((a,b)=> (a.sort_order||0)-(b.sort_order||0)).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <input className={`input${errorsGrade.grade_number? ' input-error':''}`} placeholder="Số khối (vd: 1, 2, 6, 10)" value={newGrade.grade_number} onChange={e=>setNewGrade(v=>({...v,grade_number:e.target.value}))} style={{flex:1}} />
            </div>
            {errorsGrade.level_id && <div className="input-help error">{errorsGrade.level_id}</div>}
            {errorsGrade.grade_number && <div className="input-help error">{errorsGrade.grade_number}</div>}
            <div className="mt16"><button className="btn" onClick={async()=>{ await saveGrade(); reload('GRADES') }}>Thêm khối</button></div>
          </div>
        </div>
        <div className="mt24">
          <h4>Lớp học</h4>
          <div className="mt16">
            <div className="mt16">
              <select className={`input${errorsClass.grade_id? ' input-error':''}`} value={newClass.grade_id} onChange={e=>setNewClass(v=>({...v,grade_id:e.target.value}))}>
                <option value="" disabled>Chọn khối</option>
                {grades.map(g=>{
                  const lv = levels.find(l=> String(l.id)===String(g.level_id))
                  return (
                    <option key={g.id} value={g.id}>{`${lv? lv.name:'Cấp ?'} - Khối ${g.grade_number}`}</option>
                  )
                })}
              </select>
              {errorsClass.grade_id && <div className="input-help error">{errorsClass.grade_id}</div>}
            </div>
            <div className="mt16"><input className={`input${errorsClass.name? ' input-error':''}`} placeholder="Tên lớp (vd: 1A1, 10A2)" value={newClass.name} onChange={e=>setNewClass(v=>({...v,name:e.target.value}))} />{errorsClass.name && <div className="input-help error">{errorsClass.name}</div>}</div>
            <HomeroomTeacherSelect
              levels={levels}
              grades={grades}
              classes={classes}
              teacherLevels={teacherLevels}
              teachers={teachers}
              gradeId={newClass.grade_id}
              value={newClass.homeroom_teacher_id}
              onChange={id=>setNewClass(v=>({...v,homeroom_teacher_id:id}))}
            />
            <div className="mt16"><input className={`input${errorsClass.room_name? ' input-error':''}`} placeholder="Phòng học" value={newClass.room_name} onChange={e=>setNewClass(v=>({...v,room_name:e.target.value}))} />{errorsClass.room_name && <div className="input-help error">{errorsClass.room_name}</div>}</div>
            <div className="mt16"><button className="btn" onClick={async()=>{ await saveClass(); reload('CLASSES') }}>Thêm lớp</button></div>
          </div>
        </div>
      </div>
      <div style={{flex:1}}>
        <div className="row" style={{justifyContent:'flex-start', flexWrap:'wrap'}}>
          {['LEVELS','GRADES','CLASSES'].map(t => (
            <button key={t} className={`btn ${activeTab===t? '': 'secondary'} mt16`} onClick={()=>{ setActiveTab(t); reload(t) }}>
              {t==='LEVELS'? 'Danh sách Cấp học' : t==='GRADES'? 'Danh sách Khối' : 'Danh sách Lớp học'}
            </button>
          ))}
          <button className={`btn ${activeTab===''? '': 'secondary'} mt16`} onClick={()=> setActiveTab('')}>Ẩn</button>
        </div>
        <div className="card mt16" style={{minHeight:200}}>
          <h3 style={{marginTop:0}}>{activeTab? (activeTab==='LEVELS'? 'Danh sách Cấp học' : activeTab==='GRADES'? 'Danh sách Khối' : 'Danh sách Lớp học') : 'Chọn danh mục để xem'}</h3>
          {activeTab && (
            <div className="mt16">
              <div className="row" style={{justifyContent:'space-between', flexWrap:'wrap'}}>
                <input className="input" style={{flex:1}} placeholder="Tìm kiếm" value={searchQuery} onChange={e=>{ setSearchQuery(e.target.value); setCurrentPage(1) }} />
                <div style={{width:12}} />
                <select className="input" style={{width:140}} value={pageSize} onChange={e=>{ setPageSize(parseInt(e.target.value,10)); setCurrentPage(1) }}>
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={100}>100 / trang</option>
                </select>
              </div>
              <StructureTable
                activeTab={activeTab}
                levels={levels}
                grades={grades}
                classes={classes}
                teacherLevels={teacherLevels}
                teachers={teachers}
                searchQuery={searchQuery}
                pageSize={pageSize}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTeacherLabel(teacher){
  if (!teacher) return ''
  const parts = []
  if (teacher.username) parts.push(teacher.username)
  if (teacher.email) parts.push(teacher.email)
  return parts.join(' • ')
}

function findTeacherByInput(teachers, raw){
  if (!raw) return null
  const keyword = raw.trim().toLowerCase()
  if (!keyword) return null
  return teachers.find(teacher => {
    if (String(teacher.id) === keyword) return true
    if (teacher.email && teacher.email.toLowerCase() === keyword) return true
    if (teacher.phone && teacher.phone.toLowerCase() === keyword) return true
    const label = formatTeacherLabel(teacher).toLowerCase()
    return label === keyword
  }) || null
}

function HomeroomTeacherSelect({ levels, grades, classes, teacherLevels, teachers, gradeId, value, onChange: onSelect }){
  const grade = useMemo(() => grades.find(g => String(g.id) === String(gradeId)), [grades, gradeId])
  const levelId = grade ? grade.level_id : ''

  const teacherIdsInLevel = useMemo(() => new Set((teacherLevels || [])
    .filter(tl => String(tl.level_id) === String(levelId))
    .map(tl => String(tl.teacher_id))), [teacherLevels, levelId])

  const homeroomInUse = useMemo(() => new Set((classes || [])
    .map(c => String(c.homeroom_teacher_id))
    .filter(Boolean)), [classes])

  const baseCandidates = useMemo(() => (teachers || [])
    .filter(t => teacherIdsInLevel.has(String(t.id)) && !homeroomInUse.has(String(t.id))), [teachers, teacherIdsInLevel, homeroomInUse])

  const currentTeacher = useMemo(() => {
    if (!value) return null
    return (teachers || []).find(t => String(t.id) === String(value)) || null
  }, [teachers, value])

  const candidates = useMemo(() => {
    if (!currentTeacher) return baseCandidates
    const exists = baseCandidates.some(t => String(t.id) === String(currentTeacher.id))
    return exists ? baseCandidates : [...baseCandidates, currentTeacher]
  }, [baseCandidates, currentTeacher])

  const [search, setSearch] = useState('')
  const [openList, setOpenList] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (currentTeacher) {
      setSearch(formatTeacherLabel(currentTeacher))
    } else {
      setSearch('')
    }
  }, [currentTeacher, levelId])

  const handleSelect = (teacher) => {
    if (onSelect) onSelect(teacher ? String(teacher.id) : '')
    if (teacher) {
      setSearch(formatTeacherLabel(teacher))
    }
    setOpenList(false)
  }

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return candidates
    return candidates.filter(teacher => {
      const label = formatTeacherLabel(teacher).toLowerCase()
      if (label.includes(keyword)) return true
      if (teacher.phone && String(teacher.phone).toLowerCase().includes(keyword)) return true
      return false
    })
  }, [candidates, search])

  return (
    <div className="mt16">
      <div className="input-help" style={{margin:'0 0 6px 2px'}}>Giáo viên chủ nhiệm</div>
      <div style={{position:'relative'}}>
        <input
          ref={inputRef}
          className="input"
          placeholder="Gõ tên/email giáo viên"
          value={search}
          onFocus={()=> setOpenList(true)}
          onChange={e => {
            setSearch(e.target.value)
            setOpenList(true)
          }}
          onBlur={()=> setTimeout(()=> setOpenList(false), 150)}
        />
        <button
          type="button"
          className="icon-btn"
          style={{position:'absolute', right:6, top:6}}
          onMouseDown={e=>{
            e.preventDefault()
            inputRef.current?.focus()
            setOpenList(prev => !prev)
          }}
        >▼</button>
        {openList && (
          <div className="card" style={{position:'absolute', top:'calc(100% + 4px)', left:0, right:0, maxHeight:220, overflowY:'auto', zIndex:30}}>
            {filteredCandidates.length === 0 ? (
              <div className="input-help error" style={{padding:8}}>Không tìm thấy giáo viên phù hợp</div>
            ) : (
              filteredCandidates.map(teacher => (
                <div
                  key={teacher.id}
                  style={{padding:'8px 10px', cursor:'pointer'}}
                  onMouseDown={e=>{
                    e.preventDefault()
                    handleSelect(teacher)
                  }}
                >
                  {formatTeacherLabel(teacher)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {currentTeacher && (
        <div className="input-help" style={{marginTop:6}}>
          Đang chọn: {formatTeacherLabel(currentTeacher)}
        </div>
      )}
    </div>
  )
}


function StructureTable({ activeTab, levels, grades, classes, teacherLevels, teachers, searchQuery, pageSize, currentPage, setCurrentPage }){
  const q = (searchQuery||'').toLowerCase().trim()
  let rows = []
  if (activeTab==='LEVELS') rows = levels.map(l => ({
    id:l.id, code:l.code, name:l.name, sort_order:l.sort_order
  }))
  if (activeTab==='GRADES') rows = grades.map(g => ({
    id:g.id,
    level_id:g.level_id,
    level_name:(levels.find(l=> String(l.id)===String(g.level_id))||{}).name,
    grade_number:g.grade_number
  }))
  if (activeTab==='CLASSES') rows = classes.map(c => {
    const g = grades.find(g=>String(g.id)===String(c.grade_id))
    const lv = g? levels.find(l=>String(l.id)===String(g.level_id)) : null
    const grade_number = g? Number(g.grade_number)||0 : 0
    const homeroom_name = (teachers||[]).find(t=> String(t.id)===String(c.homeroom_teacher_id))?.username || ''
    return {
      id:c.id,
      grade_id:c.grade_id,
      grade_number,
      grade_label: `${lv? lv.name:'Cấp ?'} - Khối ${g? g.grade_number:''}`,
      name:c.name,
      homeroom_teacher_id:c.homeroom_teacher_id,
      homeroom_name,
      room_name:c.room_name,
      active:c.active,
    }
  })
  if (activeTab==='TEACHERS') rows = (teacherLevels||[]).map(t => ({
    teacher_id:t.teacher_id, teacher_name:t.teacher_name, teacher_email:t.teacher_email, level_id:t.level_id, level_name:(levels.find(l=> String(l.id)===String(t.level_id))||{}).name, position:t.position||'', start_date:t.start_date||'', end_date:t.end_date||''
  }))
  let filtered = q ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(q)) : rows
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(currentPage, totalPages)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

  return (
    <>
      <table>
        {activeTab==='LEVELS' && (
          <thead><tr><th>ID</th><th>Code</th><th>Tên cấp</th><th>Thứ tự</th><th></th></tr></thead>
        )}
        {activeTab==='GRADES' && (
          <thead><tr><th>ID</th><th>Cấp học</th><th>Khối</th><th></th></tr></thead>
        )}
        {activeTab==='CLASSES' && (
          <thead><tr><th>ID</th><th>Khối</th><th>Tên lớp</th><th>GVCN</th><th>Phòng</th><th>Hoạt động</th><th></th></tr></thead>
        )}
        {activeTab==='TEACHERS' && (
          <thead><tr><th>Teacher ID</th><th>Tên giáo viên</th><th>Email</th><th>Cấp học</th><th>Chức vụ</th><th>Bắt đầu</th><th>Kết thúc</th><th></th></tr></thead>
        )}
        <tbody>
          {pageRows.map((r)=> (
            activeTab==='LEVELS'? (
              <EditableLevelRow key={`L${r.id}`} row={r} />
            ) : activeTab==='GRADES'? (
              <EditableGradeRow key={`G${r.id}`} row={r} />
            ) : activeTab==='CLASSES'? (
              <EditableClassRow key={`C${r.id}`} row={r} levels={levels} grades={grades} classes={classes} teacherLevels={teacherLevels} teachers={teachers} />
            ) : (
              <EditableTeacherLevelRow key={`T${r.teacher_id}-${r.level_id}`} row={r} levels={levels} />
            )
          ))}
        </tbody>
      </table>
      <div className="row" style={{justifyContent:'space-between', marginTop:12}}>
        <div>{total} kết quả • Trang {page}/{totalPages}</div>
        <div className="row">
          <button className="btn secondary" onClick={()=> setCurrentPage(Math.max(1, page-1))} disabled={page<=1}>Trước</button>
          <button className="btn secondary" onClick={()=> setCurrentPage(Math.min(totalPages, page+1))} disabled={page>=totalPages} style={{marginLeft:8}}>Sau</button>
        </div>
      </div>
    </>
  )
}

function EditableLevelRow({ row }){
  const [editing, setEditing] = useState(false)
  const [code, setCode] = useState(row.code||'')
  const [name, setName] = useState(row.name||'')
  const [sortOrder, setSortOrder] = useState(row.sort_order||'')
  async function save(){
    if (!name.trim()) return alert('Tên cấp không được rỗng')
    if (!confirm('Xác nhận: chỉnh sửa thông tin')) return
    await axios.put(`/api/admin/levels/${row.id}`, { code, name, sort_order: Number(sortOrder||0) })
    setEditing(false)
  }
  async function remove(){
    if (!confirm('Xác nhận xóa cấp học này?')) return
    await axios.delete(`/api/admin/levels/${row.id}`)
  }
  if (!editing) return (
    <tr><td>{row.id}</td><td>{row.code}</td><td>{row.name}</td><td>{row.sort_order}</td><td><button className="icon-btn" onClick={()=>setEditing(true)}>✏️</button><button className="icon-btn" style={{marginLeft:8}} onClick={remove}>🗑️</button></td></tr>
  )
  return (
    <tr><td>{row.id}</td><td><input className="input" value={code} onChange={e=>setCode(e.target.value)} /></td><td><input className="input" value={name} onChange={e=>setName(e.target.value)} /></td><td><input className="input" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} /></td><td><button className="btn" onClick={save}>Lưu</button><button className="btn secondary" style={{marginLeft:8}} onClick={()=>setEditing(false)}>Hủy</button></td></tr>
  )
}

function EditableGradeRow({ row }){
  const [editing, setEditing] = useState(false)
  const [levelId, setLevelId] = useState(row.level_id||'')
  const [gradeNumber, setGradeNumber] = useState(row.grade_number||'')
  async function save(){
    if (!levelId) return alert('level_id bắt buộc')
    if (!gradeNumber) return alert('grade_number bắt buộc')
    if (!confirm('Xác nhận: chỉnh sửa thông tin')) return
    await axios.put(`/api/admin/grades/${row.id}`, { level_id: levelId, grade_number: Number(gradeNumber||0) })
    setEditing(false)
  }
  async function remove(){
    if (!confirm('Xác nhận xóa khối này?')) return
    await axios.delete(`/api/admin/grades/${row.id}`)
  }
  if (!editing) return (
    <tr><td>{row.id}</td><td>{row.level_name || row.level_id}</td><td>{`Khối ${row.grade_number}`}</td><td><button className="icon-btn" onClick={()=>setEditing(true)}>✏️</button><button className="icon-btn" style={{marginLeft:8}} onClick={remove}>🗑️</button></td></tr>
  )
  return (
    <tr><td>{row.id}</td><td><input className="input" value={levelId} onChange={e=>setLevelId(e.target.value)} /></td><td><input className="input" value={gradeNumber} onChange={e=>setGradeNumber(e.target.value)} /></td><td><button className="btn" onClick={save}>Lưu</button><button className="btn secondary" style={{marginLeft:8}} onClick={()=>setEditing(false)}>Hủy</button></td></tr>
  )
}

function EditableClassRow({ row, levels, grades, classes, teacherLevels, teachers }){
  const [editing, setEditing] = useState(false)
  const [gradeId, setGradeId] = useState(row.grade_id||'')
  const [name, setName] = useState(row.name||'')
  const [homeroom, setHomeroom] = useState(row.homeroom_teacher_id||'')
  const [room, setRoom] = useState(row.room_name||'')
  const [active, setActive] = useState(!!row.active)
  async function save(){
    const className = name.trim()
    if (!className) return alert('Tên lớp không được rỗng')
    
    // Validate class name format
    const formatRegex = /^\d+A\d+$/
    if (!formatRegex.test(className)) {
      return alert('Tên lớp phải có định dạng sốAsố (ví dụ: 1A1, 10A2)')
    }
    
    // Check for duplicates (excluding current class)
    const existingClass = classes.find(c => c.id !== row.id && c.name.toLowerCase() === className.toLowerCase())
    if (existingClass) {
      return alert('Tên lớp đã tồn tại')
    }
    
    // Validate room name
    const roomName = room.trim()
    if (!roomName) {
      return alert('Nhập phòng học')
    }
    
    // Check for duplicate room names (excluding current class)
    const existingRoom = classes.find(c => c.id !== row.id && c.room_name && c.room_name.toLowerCase() === roomName.toLowerCase())
    if (existingRoom) {
      return alert('Phòng học này đã được sử dụng')
    }
    
    if (!confirm('Xác nhận: chỉnh sửa thông tin')) return
    await axios.put(`/api/admin/classes/${row.id}`, { grade_id: gradeId, name, homeroom_teacher_id: homeroom||null, room_name: room, active })
    setEditing(false)
  }
  async function remove(){
    if (!confirm('Xác nhận xóa lớp này?')) return
    await axios.delete(`/api/admin/classes/${row.id}`)
  }
  if (!editing) return (
    <tr><td>{row.id}</td><td>{row.grade_label}</td><td>{row.name}</td><td>{row.homeroom_name || ''}</td><td>{row.room_name}</td><td>{row.active? '✔' : ''}</td><td><button className="icon-btn" onClick={()=>setEditing(true)}>✏️</button><button className="icon-btn" style={{marginLeft:8}} onClick={remove}>🗑️</button></td></tr>
  )
  return (
    <tr>
      <td>{row.id}</td>
      <td>
        <select className="input" value={gradeId} onChange={e=>{ setGradeId(e.target.value); setHomeroom('') }}>
          {grades.map(g=>{
            const lv = levels.find(l=> String(l.id)===String(g.level_id))
            return <option key={g.id} value={g.id}>{`${lv? lv.name:'Cấp ?'} - Khối ${g.grade_number}`}</option>
          })}
        </select>
      </td>
      <td><input className="input" value={name} onChange={e=>setName(e.target.value)} /></td>
      <td>
        <HomeroomTeacherSelect
          levels={levels}
          grades={grades}
          classes={classes}
          teacherLevels={teacherLevels}
          teachers={teachers}
          gradeId={gradeId}
          value={homeroom}
          onChange={setHomeroom}
        />
      </td>
      <td><input className="input" value={room} onChange={e=>setRoom(e.target.value)} /></td>
      <td><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} /></td>
      <td><button className="btn" onClick={save}>Lưu</button><button className="btn secondary" style={{marginLeft:8}} onClick={()=>setEditing(false)}>Hủy</button></td>
    </tr>
  )
}

function EditableTeacherLevelRow({ row, levels }){
  const [editing, setEditing] = useState(false)
  const [levelId, setLevelId] = useState(row.level_id)
  const [position, setPosition] = useState(row.position||'')
  const [start, setStart] = useState(row.start_date? String(row.start_date).slice(0,10): '')
  const [end, setEnd] = useState(row.end_date? String(row.end_date).slice(0,10): '')
  async function save(){
    if (!confirm('Xác nhận: chỉnh sửa thông tin')) return
    await axios.put('/api/admin/teacher-levels', { teacher_id: row.teacher_id, level_id: levelId, position, start_date: start||null, end_date: end||null })
    setEditing(false)
  }
  async function remove(){
    if (!confirm('Xác nhận xóa liên kết giáo viên-cấp này?')) return
    await axios.delete('/api/admin/teacher-levels', { params:{ teacher_id: row.teacher_id, level_id: row.level_id } })
  }
  if (!editing) return (
    <tr>
      <td>{row.teacher_id}</td>
      <td>{row.teacher_name}</td>
      <td>{row.teacher_email}</td>
      <td>{row.level_name || row.level_id}</td>
      <td>{row.position||''}</td>
      <td>{formatDate(row.start_date)}</td>
      <td>{formatDate(row.end_date)}</td>
      <td>
        <button className="icon-btn" onClick={()=>setEditing(true)}>✏️</button>
        <button className="icon-btn" onClick={remove} style={{marginLeft:8}}>🗑️</button>
      </td>
    </tr>
  )
  return (
    <tr>
      <td>{row.teacher_id}</td>
      <td>{row.teacher_name}</td>
      <td>{row.teacher_email}</td>
      <td>
        <select className="input" value={levelId} onChange={e=>setLevelId(e.target.value)}>
          {levels.map(l=> <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </td>
      <td><input className="input" value={position} onChange={e=>setPosition(e.target.value)} /></td>
      <td><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} /></td>
      <td><input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} /></td>
      <td>
        <button className="btn" onClick={save}>Lưu</button>
        <button className="btn secondary" onClick={()=>setEditing(false)} style={{marginLeft:8}}>Hủy</button>
      </td>
    </tr>
  )
}

function TeacherLevelForm({ levels, onSaved }){
  const [teacherId, setTeacherId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [position, setPosition] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  async function add(){
    setError('')
    if (!teacherId || !levelId) { setError('Chọn giáo viên và cấp học'); return }
    await axios.post('/api/admin/teacher-levels', { teacher_id: Number(teacherId), level_id: Number(levelId), position: position||null, start_date: start||null, end_date: end||null })
    setTeacherId(''); setLevelId(''); setPosition(''); setStart(''); setEnd('')
    onSaved && onSaved()
  }
  return (
    <div>
      <div className="row mt16">
        <input className="input" placeholder="Giáo viên (user_id)" value={teacherId} onChange={e=>setTeacherId(e.target.value)} />
        <select className="input" value={levelId} onChange={e=>setLevelId(e.target.value)}>
          <option value="" disabled>Cấp học</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div className="row mt16">
        <input className="input" placeholder="Chức vụ (tùy chọn)" value={position} onChange={e=>setPosition(e.target.value)} />
        <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
        <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
      </div>
      {error && <div className="input-help error mt16">{error}</div>}
      <div className="mt16"><button className="btn" onClick={add}>Thêm giáo viên vào cấp</button></div>
    </div>
  )
}

