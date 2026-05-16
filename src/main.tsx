import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { RecordingApp } from './RecordingApp';
import { I18nGate } from './i18n/I18nGate';
import './styles.css';

const root = createRoot(document.getElementById('root')!);

const route = window.location.hash.replace(/^#/, '') || '/';
const isRecordingWindow = route.startsWith('/recording');

if (isRecordingWindow) {
  document.documentElement.classList.add('recording-window');
  document.body.classList.add('recording-window');
}

void window.bisbi?.getPlatform().then((p) => {
  document.body.dataset.platform = p;
});

root.render(
  <React.StrictMode>
    <I18nGate>
      {isRecordingWindow ? <RecordingApp /> : <App />}
    </I18nGate>
  </React.StrictMode>
);
