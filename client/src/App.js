
import './App.css';
import{Routes,Route} from 'react-router-dom'
import HomePage from './pages/HomePage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={HomePage} />
        <Route path="/login" element={Login} />
        <Route path="/" element={Register} />
      </Routes>
    </div>
  );
}

export default App;
