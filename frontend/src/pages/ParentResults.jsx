import { useState } from 'react'
import axios from 'axios'

export default function ParentResults(){
  const [studentId, setStudentId] = useState('')
  const [rows, setRows] = useState([])

  async function load(){
    if(!studentId) return
    const { data } = await axios.get(`/api/parent/children/${studentId}/results`)
    setRows(data)
  }

  return (
    <div className="card">
      <h3>Kết quả học tập của con</h3>
      <div className="row mt16">
        <input className="input" placeholder="student_id" value={studentId} onChange={e=>setStudentId(e.target.value)} />
        <button className="btn" onClick={load}>Xem</button>
      </div>
      <div className="mt16">
        {rows.length===0? ' ' : (
          <table>
            <thead><tr><th>Học kỳ</th><th>Môn</th><th>Miệng</th><th>KT</th><th>Thi</th><th>TB</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}><td>{r.term_name}</td><td>{r.subject_name}</td><td>{r.oral ?? ''}</td><td>{r.test ?? ''}</td><td>{r.exam ?? ''}</td><td>{r.average ?? ''}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


