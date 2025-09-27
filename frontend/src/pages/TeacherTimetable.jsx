import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6']
const PERIODS = ['Tiết 1','Tiết 2','Tiết 3','Tiết 4','Tiết 5','Tiết 6','Tiết 7','Tiết 8','Tiết 9','Tiết 10']

export default function TeacherTimetable(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      try{
        const { data } = await axios.get('/api/teacher/timetable')
        setRows(data)
      }finally{ setLoading(false) }
    })()
  },[])

  const matrix = useMemo(()=>{
    const grid = Array.from({ length: PERIODS.length }, () => Array(DAYS.length).fill(null))
    for (const entry of rows) {
      const dayIdx = Number(entry.day_of_week || 0) - 2
      const periodIdx = Number(entry.period_index || 1) - 1
      if (dayIdx>=0 && dayIdx<DAYS.length && periodIdx>=0 && periodIdx<PERIODS.length) {
        grid[periodIdx][dayIdx] = entry
      }
    }
    return grid
  }, [rows])

  return (
    <div className="timetable-card" style={{boxShadow:'0 12px 30px rgba(15,23,42,.12)', borderRadius:16}}>
      <div className="timetable-header">
        <div></div>
        {DAYS.map(day => <div key={day}>{day}</div>)}
      </div>
      {loading ? (
        <div style={{padding:24}}>Đang tải...</div>
      ) : (
        matrix.map((row,rowIdx)=>(
          <div key={rowIdx} className="timetable-row">
            <div className="timetable-slot timetable-slot--label">{PERIODS[rowIdx]}</div>
            {row.map((cell,colIdx)=>(
              <div key={`${rowIdx}-${colIdx}`} className="timetable-slot">
                {cell ? (
                  <div className={`timetable-event ${colIdx % 2 ? 'timetable-event--accent' : ''}`}>
                    <strong>{cell.subject_name || `Môn ${cell.subject_id}`}</strong>
                    <span>{cell.class_name || ''}</span>
                    <span>{cell.room_name || ''}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}


