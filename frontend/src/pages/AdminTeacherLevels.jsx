import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

export default function AdminTeacherLevels(){
  const [levels, setLevels] = useState([])
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ teacher_id:'', level_id:'', position:'', start_date:'', end_date:'' })
  const [errors, setErrors] = useState({})
  const [teachers, setTeachers] = useState([])
  const [availableTeachers, setAvailableTeachers] = useState([])
  const [selectedName, setSelectedName] = useState('')
  const [emailsForName, setEmailsForName] = useState([])
  const startRef = useRef(null)
  const endRef = useRef(null)
  const [filterLevel, setFilterLevel] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  function toIsoFromText(s){
    const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(s || '')
    return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
  }
  function toTextFromIso(iso){
    if (!iso) return ''
    try {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (_err) {
      return ''
    }
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  async function load(){
    console.log('=== LOAD FUNCTION CALLED ===')
    try{
      console.log('Loading data from API...')
      const [lev, tl, te] = await Promise.all([
        axios.get('/api/admin/levels'),
        axios.get('/api/admin/teacher-levels'),
        axios.get('/api/admin/users', { params: { role: 'TEACHER' } })
      ])
      console.log('Data loaded:', { levels: lev.data.length, teacherLevels: tl.data.length, teachers: te.data.length })
      setLevels(lev.data)
      setRows(tl.data)
      setTeachers(te.data || [])
      const assignedIds = new Set((tl.data||[]).map(x=> String(x.teacher_id)))
      const avail = (te.data||[]).filter(u => !assignedIds.has(String(u.id)))
      setAvailableTeachers(avail)
      console.log('State updated successfully')
      setRefreshKey(prev => prev + 1)
      console.log('Refresh key updated:', refreshKey + 1)
    }catch(err){
      // Minimal friendly handling: if unauthorized, suggest login
      console.warn('Load error', err)
    }
  }
  useEffect(()=>{ load() }, [])

  async function add(){
    const e = {}
    if (!form.teacher_id) e.teacher_id = 'Chọn giáo viên (email)'
    if (!form.level_id) e.level_id = 'Chọn cấp học'
    setErrors(e)
    if (Object.keys(e).length) return
    // convert text dates to ISO
    const startIso = toIsoFromText(form.start_date) || (form.start_date || '')
    const endIso = toIsoFromText(form.end_date) || (form.end_date || '')
    try{
      await axios.post('/api/admin/teacher-levels', {
        teacher_id: Number(form.teacher_id),
        level_id: Number(form.level_id),
        position: form.position || null,
        start_date: startIso || null,
        end_date: endIso || null,
      })
      setForm({ teacher_id:'', level_id:'', position:'', start_date:'', end_date:'' })
      setErrors({})
      await load()
    }catch(err){
      const apiMsg = err?.response?.data?.error || 'Không thêm được. Kiểm tra dữ liệu.'
      setErrors(prev=>({ ...prev, general: apiMsg }))
    }
  }

  const q = search.toLowerCase().trim()
  const filteredByText = q ? rows.filter(r => (
    (r.teacher_name||'').toLowerCase().includes(q) || (r.teacher_email||'').toLowerCase().includes(q)
  )) : rows
  const filtered = filterLevel ? filteredByText.filter(r => String(r.level_id)===String(filterLevel)) : filteredByText
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(currentPage, totalPages)
  const startIdx = (page - 1) * pageSize
  const endIdx = startIdx + pageSize
  const pageRows = filtered.slice(startIdx, endIdx)

  return (
    <div className="user-page">
      <div className="card user-top-card">
        <h3>Quản lý giáo viên theo cấp</h3>
        <div className="user-form-grid">
          <div className={`field${errors.teacher_id ? ' has-error' : ''}`}>
            <label className="field-label">Chọn giáo viên (Tên)</label>
            <select className={`input${errors.teacher_id? ' input-error':''}`} value={selectedName} onChange={e=>{
              const name = e.target.value; setSelectedName(name);
              const list = (availableTeachers||[]).filter(t=> (t.username||'')===name);
              setEmailsForName(list);
              setForm(f=>({...f, teacher_id:''}));
            }}>
              <option value="">-- Chọn tên giáo viên --</option>
              {[...new Set((availableTeachers||[]).map(t=>t.username).filter(Boolean))].map(name=> (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {errors.teacher_id && <div className="field-error">{errors.teacher_id}</div>}
          </div>

          <div className={`field${errors.teacher_id ? ' has-error' : ''}`}>
            <label className="field-label">Chọn tài khoản (Email)</label>
            <select className={`input${errors.teacher_id? ' input-error':''}`} value={form.teacher_id} onChange={e=>setForm(f=>({...f,teacher_id:e.target.value}))}>
              <option value="">-- Chọn email --</option>
              {(emailsForName.length? emailsForName : availableTeachers).map(t => (
                <option key={t.id} value={t.id}>{t.email || t.username || t.id}</option>
              ))}
            </select>
            {errors.teacher_id && <div className="field-error">{errors.teacher_id}</div>}
          </div>

          <div className={`field${errors.level_id ? ' has-error' : ''}`}>
            <label className="field-label">Cấp học</label>
            <select className={`input${errors.level_id? ' input-error':''}`} value={form.level_id} onChange={e=>setForm(f=>({...f,level_id:e.target.value}))}>
              <option value="">-- Chọn cấp học --</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {errors.level_id && <div className="field-error">{errors.level_id}</div>}
          </div>

          <div className="field">
            <label className="field-label">Môn chuyên (tùy chọn)</label>
            <input className="input" placeholder="Ví dụ: Toán nâng cao" value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} />
          </div>

          <div className="field">
            <label className="field-label">Ngày bắt đầu</label>
            <div className="field-inline">
              <input className="input" placeholder="dd/mm/yyyy" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} />
              <input ref={startRef} type="date" className="field-date-hidden" value={toIsoFromText(form.start_date) || ''} onChange={e=>setForm(f=>({...f,start_date: toTextFromIso(e.target.value)}))} />
              <button type="button" className="btn secondary" onClick={()=>startRef.current && (startRef.current.showPicker? startRef.current.showPicker() : startRef.current.click())}>Chọn</button>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Ngày kết thúc (tùy chọn)</label>
            <div className="field-inline">
              <input className="input" placeholder="dd/mm/yyyy" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} />
              <input ref={endRef} type="date" className="field-date-hidden" value={toIsoFromText(form.end_date) || ''} onChange={e=>setForm(f=>({...f,end_date: toTextFromIso(e.target.value)}))} />
              <button type="button" className="btn secondary" onClick={()=>endRef.current && (endRef.current.showPicker? endRef.current.showPicker() : endRef.current.click())}>Chọn</button>
            </div>
          </div>
        </div>

        {errors.general && <div className="user-alert user-alert--error">{errors.general}</div>}

        <div className="user-actions">
          <button className="btn secondary" onClick={()=>{
            setForm({ teacher_id:'', level_id:'', position:'', start_date:'', end_date:'' })
            setSelectedName('')
            setEmailsForName([])
            setErrors({})
          }}>Làm mới</button>
          <button className="btn" onClick={add}>Thêm giáo viên vào cấp</button>
        </div>
      </div>

      <div className="card user-list-card">
        <div className="mt16" style={{minHeight:200}}>
          <h3 style={{marginTop:0}}>Danh sách Giáo viên theo Cấp</h3>
          <div className="mt16">
            {!rows || rows.length === 0 ? <div>Không có dữ liệu</div> : (
              <>
                <div className="user-toolbar">
                  <input className="input user-toolbar__item user-toolbar__item--search" placeholder="Tìm theo tên hoặc email" value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} />
                  <select className="input user-toolbar__item" value={filterLevel} onChange={e=>{ setFilterLevel(e.target.value); setCurrentPage(1) }}>
                    <option value="">Lọc theo cấp học</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <select className="input user-toolbar__item" value={pageSize} onChange={e=>{ setPageSize(parseInt(e.target.value,10)); setCurrentPage(1) }}>
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={100}>100 / trang</option>
                  </select>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã GV</th>
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Cấp học</th>
                        <th>Môn chuyên</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((r, index) => (
                        <Row key={`${r.teacher_id}-${r.level_id}-${index}-${refreshKey}`} r={r} levels={levels} onChanged={load} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row" style={{justifyContent:'space-between', marginTop:12}}>
                  <div>{total} kết quả • Trang {page}/{totalPages}</div>
                  <div className="row">
                    <button className="btn secondary" onClick={()=> setCurrentPage(Math.max(1, page-1))} disabled={page<=1}>Trước</button>
                    <button className="btn secondary" onClick={()=> setCurrentPage(Math.min(totalPages, page+1))} disabled={page>=totalPages} style={{marginLeft:8}}>Sau</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ r, levels, onChanged }){
  console.log('Row component rendered for:', r.teacher_id, r.level_id)
  const [editing, setEditing] = useState(false)
  const [levelId, setLevelId] = useState(r.level_id)
  const [position, setPosition] = useState(r.position||'')
  const [start, setStart] = useState(r.start_date? String(r.start_date).slice(0,10): '')
  const [end, setEnd] = useState(r.end_date? String(r.end_date).slice(0,10): '')
  
  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
  async function save(){
    console.log('=== SAVE FUNCTION CALLED ===')
    console.log('Saving teacher-level:', { teacher_id:r.teacher_id, level_id: levelId, position, start_date:start||null, end_date:end||null })
    console.log('API URL:', '/api/admin/teacher-levels')
    console.log('Request payload:', { teacher_id:r.teacher_id, level_id: levelId, position, start_date:start||null, end_date:end||null })
    try {
      console.log('Making PUT request...')
      const response = await axios.put('/api/admin/teacher-levels', { teacher_id:r.teacher_id, level_id: levelId, position, start_date:start||null, end_date:end||null })
      console.log('Save successful! Response:', response.data)
      setEditing(false)
      console.log('Calling onChanged to reload data...')
      onChanged && onChanged()
      console.log('onChanged called')
    } catch (error) {
      console.error('Save failed:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      const errorMessage = error.response?.data?.error || error.message
      alert('Lỗi khi lưu: ' + errorMessage)
      
      // If it's a homeroom teacher error, show specific message
      if (errorMessage.includes('giáo viên chủ nhiệm')) {
        alert('⚠️ ' + errorMessage)
      }
    }
  }
  async function remove(){
    console.log('Removing teacher-level:', { teacher_id:r.teacher_id, level_id:r.level_id })
    if (!confirm('Xóa liên kết?')) return
    try {
      await axios.delete('/api/admin/teacher-levels', { params:{ teacher_id:r.teacher_id, level_id:r.level_id } })
      console.log('Delete successful!')
      onChanged && onChanged()
    } catch (error) {
      console.error('Delete failed:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.error || error.message
      alert('Lỗi khi xóa: ' + errorMessage)
      
      // If it's a homeroom teacher error, show specific message
      if (errorMessage.includes('giáo viên chủ nhiệm')) {
        alert('⚠️ ' + errorMessage)
      }
    }
  }
  if (!editing) return (
    <tr>
      <td>{r.teacher_id}</td>
      <td>{r.teacher_name}</td>
      <td>{r.teacher_email}</td>
      <td>{(levels.find(l=> String(l.id)===String(r.level_id))||{}).name || r.level_id}</td>
      <td>{r.position||''}</td>
      <td>{formatDate(r.start_date)}</td>
      <td>{formatDate(r.end_date)}</td>
      <td>
        <button className="icon-btn" onClick={()=>{ console.log('Edit clicked for:', r.teacher_id, r.level_id); setEditing(true); console.log('Editing mode enabled') }}>✏️</button>
        <button className="icon-btn" onClick={()=>{ console.log('Delete clicked for:', r.teacher_id, r.level_id); remove() }} style={{marginLeft:8}}>🗑️</button>
      </td>
    </tr>
  )
  return (
    <tr>
      <td>{r.teacher_id}</td>
      <td>{r.teacher_name}</td>
      <td>{r.teacher_email}</td>
      <td>
        <select className="input" value={levelId} onChange={e=>setLevelId(e.target.value)}>
          {levels.map(l=> <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </td>
      <td><input className="input" placeholder="Môn chuyên" value={position} onChange={e=>setPosition(e.target.value)} /></td>
      <td><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} /></td>
      <td><input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} /></td>
      <td>
        <button className="btn" onClick={()=>{ console.log('Save button clicked!'); save() }}>Lưu</button>
        <button className="btn secondary" onClick={()=>setEditing(false)} style={{marginLeft:8}}>Hủy</button>
      </td>
    </tr>
  )
}


