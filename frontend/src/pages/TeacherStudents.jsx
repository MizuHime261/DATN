import { useEffect, useState } from 'react'
import axios from 'axios'

export default function TeacherStudents(){
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  async function load(){
    const { data } = await axios.get('/api/teacher/students', { params: q? { q } : {} })
    setRows(data)
  }
  useEffect(()=>{ load() },[])
  return (
    <div className="card">
      <h3>Danh sách học sinh</h3>
      <div className="row mt16">
        <input className="input" placeholder="Tìm theo tên/SĐT" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={load}>Tìm</button>
      </div>
      <div className="mt16">
        {rows.length===0? 'Không có dữ liệu' : (
          <table>
            <thead><tr><th>Tên</th><th>Lớp</th><th>Ngày sinh</th><th>Giới tính</th><th>ĐT HS</th><th>ĐT PH</th></tr></thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id}><td>{s.username}</td><td>{s.class_name}</td><td>{s.birthdate || ''}</td><td>{s.gender || ''}</td><td>{s.phone || ''}</td><td>{s.parent_phone || ''}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


