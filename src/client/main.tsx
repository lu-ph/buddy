import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NotePanel } from './note-panel/NotePanel';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotePanel />
  </StrictMode>,
)
