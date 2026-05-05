import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { RecordingApp } from './RecordingApp';
import './styles.css';

const root = createRoot(document.getElementById('root')!);

const route = window.location.hash.replace(/^#/, '') || '/';
const isRecordingWindow = route.startsWith('/recording');

root.render(
  <React.StrictMode>
    {isRecordingWindow ? <RecordingApp /> : <App />}
  </React.StrictMode>
);
