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

export default function TeacherStudents(){
  const [rows, setRows] = useState([])
  const [classes, setClasses] = useState([])
  const [q, setQ] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(()=>{ (async()=>{
    try {
      const { data } = await axios.get('/api/teacher/classes')
      setClasses(data)
    } catch {}
  })() }, [])
  
  async function load(){
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (selectedClass) params.class_id = selectedClass
      const { data } = await axios.get('/api/teacher/students', { params })
      setRows(data)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(()=>{ load() },[])
  
  return (
    <div className="card">
      <h3>Danh sách học sinh</h3>
      <div className="row mt16">
        <input 
          className="input" 
          placeholder="Tìm theo tên/SĐT" 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
        />
        <select 
          className="input" 
          value={selectedClass} 
          onChange={e=>setSelectedClass(e.target.value)}
        >
          <option value="">-- Tất cả lớp --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? 'Đang tải...' : 'Tìm'}
        </button>
      </div>
      <div className="mt16">
        {loading ? (
          <div>Đang tải...</div>
        ) : rows.length===0? (
          <div>Không có dữ liệu</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Tên học sinh</th>
                  <th>Lớp</th>
                  <th>Giới tính</th>
                  <th>Ngày sinh</th>
                  <th>SĐT học sinh</th>
                  <th>Tên phụ huynh</th>
                  <th>SĐT phụ huynh</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id}>
                    <td>{s.username}</td>
                    <td>{s.class_name}</td>
                    <td>{s.gender || ''}</td>
                    <td>{formatDate(s.birthdate)}</td>
                    <td>{s.phone || ''}</td>
                    <td>{s.parent_name || ''}</td>
                    <td>{s.parent_phone || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


