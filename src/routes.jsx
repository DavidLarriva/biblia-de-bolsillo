import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import LecturaPage from './features/lectura/LecturaPage'
import VersiculosPage from './features/versiculos/VersiculosPage'
import DiarioPage from './features/diario/DiarioPage'
import JournalEntryEditorPage from './features/diario/JournalEntryEditorPage'
import OracionPage from './features/oracion/OracionPage'
import NotasPage from './features/notas/NotasPage'
import StudyNoteDetailPage from './features/notas/StudyNoteDetailPage'
import StudyNoteEditorPage from './features/notas/StudyNoteEditorPage'
import MetasPage from './features/metas/MetasPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'lectura', element: <LecturaPage /> },
      { path: 'versiculos', element: <VersiculosPage /> },
      { path: 'diario', element: <DiarioPage /> },
      { path: 'diario/nueva', element: <JournalEntryEditorPage /> },
      { path: 'diario/:id', element: <JournalEntryEditorPage /> },
      { path: 'oracion', element: <OracionPage /> },
      { path: 'notas', element: <NotasPage /> },
      { path: 'notas/nueva', element: <StudyNoteEditorPage /> },
      { path: 'notas/:id', element: <StudyNoteDetailPage /> },
      { path: 'notas/:id/editar', element: <StudyNoteEditorPage /> },
      { path: 'metas', element: <MetasPage /> },
    ],
  },
])
