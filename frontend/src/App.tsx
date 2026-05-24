import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import { DebugOverlay } from './components/ui/DebugOverlay';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <DebugOverlay />
    </BrowserRouter>
  );
}

export default App;
