import { HashRouter, Routes, Route } from 'react-router-dom';
import CreateCard from './pages/CreateCard';
import ViewCard from './pages/ViewCard';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CreateCard />} />
        <Route path="/card/:data" element={<ViewCard />} />
      </Routes>
    </HashRouter>
  );
}
