import { useEffect, useState } from 'react'
import axios from 'axios'

export default function StudentClassInfo(){
  const [info, setInfo] = useState(null)
  useEffect(()=>{
    (async()=>{
      const { data } = await axios.get('/api/student/me/class')
      setInfo(data)
    })()
  },[])
  return (
    <div className="card">
      <h3>Thông tin lớp của tôi</h3>
      {info ? (
        <div className="mt16">
          <div>Lớp: {info.name} - Phòng {info.room_name}</div>
          <div>GVCN: {info.homeroom_teacher || ''}</div>
        </div>
      ) : 'Đang tải...'}
    </div>
  )
}


