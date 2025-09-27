import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../state/AuthContext.jsx'

export default function ParentTimetable(){
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    if(!studentId) return
    setLoading(true)
    try{
      const { data } = await axios.get(`/api/parent/children/${studentId}/timetable`)
      setRows(data)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ setRows([]) }, [studentId])

  return (
    <div className="card">
      <h3>Thời khóa biểu (Phụ huynh)</h3>
      <div className="row mt16">
        <input className="input" placeholder="Nhập student_id" value={studentId} onChange={e=>setStudentId(e.target.value)} />
        <button className="btn" onClick={load}>Xem</button>
      </div>
      {loading? 'Đang tải...' : (
        <div className="mt16">
          {rows.length===0? 'Không có dữ liệu' : (
            <table>
              <thead>
                <tr><th>Thứ</th><th>Tiết</th><th>Lớp</th><th>Môn</th></tr>
              </thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.id}>
                    <td>{r.day_of_week}</td>
                    <td>{r.period_index}</td>
                    <td>{r.class_name}</td>
                    <td>{r.subject_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}


