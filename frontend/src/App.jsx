import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Result from './pages/Result';
import RealTime from './pages/RealTime';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/result/:taskId" element={<Result />} />
      <Route path="/realtime" element={<RealTime />} />
    </Routes>
  );
}

export default App;
