import { useEffect, useState } from 'react'
import axios from 'axios'

export default function TeacherReport(){
  const [classes, setClasses] = useState([])
  const [terms, setTerms] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(()=>{ (async()=>{
    try {
      const [cls, term] = await Promise.all([
        axios.get('/api/teacher/classes'),
        axios.get('/api/teacher/terms')
      ])
      setClasses(cls.data)
      setTerms(term.data)
    } catch {
      setMsg('Không tải được danh sách lớp/học kỳ')
    }
  })() }, [])

  async function load(){
    if (!selectedClass || !selectedTerm) return
    setMsg('')
    setLoading(true)
    try{
      const { data } = await axios.get('/api/teacher/report', {
        params: { class_id: selectedClass, term_id: selectedTerm }
      })
      setRows(data)
    }catch(err){
      setMsg('Tải báo cáo thất bại')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3>Báo cáo kết quả học tập (theo lớp)</h3>
      <div className="row mt16">
        <select className="input" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
          <option value="">-- Chọn lớp --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} disabled={!selectedClass}>
          <option value="">-- Chọn học kỳ --</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="btn" onClick={load} disabled={!selectedClass || !selectedTerm || loading}>{loading ? 'Đang tải...' : 'Xem báo cáo'}</button>
      </div>

      {msg && <div className="mt16" style={{color: 'red'}}>{msg}</div>}

      <div className="mt16">
        {rows.length===0? (
          <div className="muted">Chọn lớp và học kỳ để xem báo cáo.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Mã HS</th>
                  <th>Họ tên</th>
                  <th>Môn & điểm TB (theo học kỳ)</th>
                  <th>Điểm TB học kỳ</th>
                  <th>Điểm TB cả năm</th>
                  <th>Hạnh kiểm</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.student_id}>
                    <td>{r.student_id}</td>
                    <td>{r.username}</td>
                    <td>
                      {r.subjects && r.subjects.length>0 ? (
                        <ul style={{margin: 0, paddingLeft: 16}}>
                          {r.subjects.map(s => (
                            <li key={s.subject_id}>{s.subject_name}: {s.average != null ? Number(s.average).toFixed(2) : ''}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="muted">Chưa có điểm</span>
                      )}
                    </td>
                    <td>{r.term_avg ?? ''}</td>
                    <td>{r.year_avg ?? ''}</td>
                    <td>{r.conduct_rating ?? ''}</td>
                    <td>{r.conduct_note ?? ''}</td>
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

