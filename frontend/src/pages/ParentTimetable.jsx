import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../state/AuthContext.jsx'

const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật']
const MAX_PERIODS = 10

export default function ParentTimetable(){
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [children, setChildren] = useState([])
  const [meta, setMeta] = useState({ class_name:'', room_name:'', term_name:'' })

  async function load(){
    if(!studentId) return
    setLoading(true)
    try{
      const { data } = await axios.get(`/api/parent/children/${studentId}/timetable`)
      setRows(data)
      if (Array.isArray(data) && data.length){
        const first = data[0]
        setMeta({ class_name:first.class_name||'', room_name:first.room_name||'', term_name:first.term_name||'' })
      } else {
        setMeta({ class_name:'', room_name:'', term_name:'' })
      }
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ (async()=>{
    try{
      const { data } = await axios.get('/api/parent/children')
      setChildren(data||[])
      if ((data||[]).length === 1){
        setStudentId(String(data[0].id))
      }
    }catch(_e){}
  })() },[])

  useEffect(()=>{ setRows([]); if(studentId) load() }, [studentId])

  const matrix = useMemo(()=>{
    const grid = Array.from({ length: MAX_PERIODS }, () => Array(DAYS.length).fill(null))
    for (const entry of rows) {
      const dayIdx = Number(entry.day_of_week || 0) - 1
      const periodIdx = Number(entry.period_index || 1) - 1
      if (dayIdx>=0 && dayIdx<DAYS.length && periodIdx>=0 && periodIdx<MAX_PERIODS) {
        grid[periodIdx][dayIdx] = entry
      }
    }
    return grid
  }, [rows])

  return (
    <div className="card">
      <div className="header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h3>Thời khóa biểu {meta.class_name ? `- Lớp ${meta.class_name}` : ''}</h3>
          <div className="row mt16" style={{opacity:.8}}>
            {meta.term_name ? `Học kỳ: ${meta.term_name}` : ''}
            {meta.room_name ? (meta.term_name ? ' • ' : '') + `Phòng: ${meta.room_name}` : ''}
          </div>
        </div>
        <div>
          {children.length <= 1 ? (
            <div style={{opacity:.9}}>{children.length === 1 ? `Học sinh: ${children[0].username}` : 'Chưa có liên kết học sinh'}</div>
          ) : (
            <select className="input" value={studentId} onChange={e=>setStudentId(e.target.value)}>
              <option value="">Chọn con</option>
              {children.map(c=> (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && <div className="mt16">Đang tải...</div>}

      <div className="timetable-matrix" style={{marginTop:16}}>
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Thứ</th>
              {Array.from({ length: MAX_PERIODS }, (_, i) => (
                <th key={i + 1}>Tiết {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIdx) => (
              <tr key={dayIdx}>
                <td className="day-header">{day}</td>
                {Array.from({ length: MAX_PERIODS }, (_, i) => {
                  const periodIndex = i + 1
                  const entry = matrix[i][dayIdx]
                  return (
                    <td key={periodIndex} className="timetable-cell">
                      {entry ? (
                        <div className="entry">
                          <div className="subject">{entry.subject_name || `Môn ${entry.subject_id}`}</div>
                          <div className="teacher">
                            {entry.teacher_name || ''}
                            {entry.teacher_phone ? (
                              <>
                                {' '}•{' '}
                                <a href={`tel:${entry.teacher_phone}`}>{entry.teacher_phone}</a>
                              </>
                            ) : null}
                          </div>
                          <div className="room">{entry.room_name || ''}</div>
                        </div>
                      ) : (
                        <div className="empty-slot" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


