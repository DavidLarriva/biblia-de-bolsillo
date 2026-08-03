import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Cargadas bajo demanda: recharts (solo Lectura) y tiptap (Diario/Notas/
// Oración) son de las dependencias más pesadas del bundle, y no tiene
// sentido arrastrarlas al chunk inicial de Login/Inicio para alguien que
// nunca visita esas secciones en esta sesión.
const HomePage = lazy(() => import('./pages/HomePage'))
const LecturaPage = lazy(() => import('./features/lectura/LecturaPage'))
const VersiculosPage = lazy(() => import('./features/versiculos/VersiculosPage'))
const DiarioPage = lazy(() => import('./features/diario/DiarioPage'))
const JournalEntryEditorPage = lazy(() => import('./features/diario/JournalEntryEditorPage'))
const OracionPage = lazy(() => import('./features/oracion/OracionPage'))
const NotasPage = lazy(() => import('./features/notas/NotasPage'))
const StudyNoteDetailPage = lazy(() => import('./features/notas/StudyNoteDetailPage'))
const StudyNoteEditorPage = lazy(() => import('./features/notas/StudyNoteEditorPage'))
const MetasPage = lazy(() => import('./features/metas/MetasPage'))

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
