import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Faculty from './pages/Faculty'
import Subjects from './pages/Subjects'
import Classes from './pages/Classes'
import Classrooms from './pages/Classrooms'
import GenerateTimetable from './pages/GenerateTimetable'
import ViewTimetable from './pages/ViewTimetable'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classrooms" element={<Classrooms />} />
          <Route path="generate-timetable" element={<GenerateTimetable />} />
          <Route path="view-timetable" element={<ViewTimetable />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
