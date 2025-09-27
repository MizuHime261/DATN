import { useEffect, useState } from 'react'
import axios from 'axios'

export default function StudentResults(){
  const [rows, setRows] = useState([])
  useEffect(()=>{
    (async()=>{
      const { data } = await axios.get('/api/student/me/results')
      setRows(data)
    })()
  },[])
  return (
    <div className="card">
      <h3>Kết quả học tập của tôi</h3>
      <div className="mt16">
        {rows.length===0? ' ' : (
          <div className="table-responsive">
            <table>
              <thead><tr><th>Học kỳ</th><th>Môn</th><th>Miệng</th><th>KT</th><th>Thi</th><th>TB</th></tr></thead>
              <tbody>
                {rows.map(r => (<tr key={r.id}><td>{r.term_name}</td><td>{r.subject_name}</td><td>{r.oral ?? ''}</td><td>{r.test ?? ''}</td><td>{r.exam ?? ''}</td><td>{r.average ?? ''}</td></tr>))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )}


