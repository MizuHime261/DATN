import { useState } from 'react'
import axios from 'axios'

export default function TeacherReport(){
  const [form, setForm] = useState({ class_id:'', subject_id:'', term_id:'' })
  const [rows, setRows] = useState([])

  async function load(){
    const { data } = await axios.get('/api/teacher/grades/report', { params: form })
    setRows(data)
  }

  function downloadCsv(){
    const p = new URLSearchParams({ ...form, format:'csv' }).toString()
    window.open(`/api/teacher/grades/report?${p}`, '_blank')
  }

  return (
    <div className="card">
      <h3>Báo cáo kết quả học tập</h3>
      <div className="row mt16">
        <input className="input" placeholder="class_id" value={form.class_id} onChange={e=>setForm(f=>({...f,class_id:e.target.value}))} />
        <input className="input" placeholder="subject_id" value={form.subject_id} onChange={e=>setForm(f=>({...f,subject_id:e.target.value}))} />
        <input className="input" placeholder="term_id" value={form.term_id} onChange={e=>setForm(f=>({...f,term_id:e.target.value}))} />
        <button className="btn" onClick={load} disabled={!form.class_id || !form.subject_id || !form.term_id}>Xem</button>
        <button className="btn secondary" onClick={downloadCsv} disabled={!form.class_id || !form.subject_id || !form.term_id}>Tải CSV</button>
      </div>
      <div className="mt16">
        {rows.length===0? ' ' : (
          <table>
            <thead><tr><th>Mã HS</th><th>Họ tên</th><th>Miệng</th><th>KT</th><th>Thi</th><th>TB</th></tr></thead>
            <tbody>
              {rows.map(r => (<tr key={r.student_id}><td>{r.student_id}</td><td>{r.username}</td><td>{r.oral ?? ''}</td><td>{r.test ?? ''}</td><td>{r.exam ?? ''}</td><td>{r.average ?? ''}</td></tr>))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


