import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export function RequireAuth({ children }){
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export function RequireRoles({ roles = [], children }){
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles.length && (!user || !roles.includes(user.role))) return <Navigate to="/login" replace />
  return children
}


