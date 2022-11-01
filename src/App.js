import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapCanvas from "./MapCanvas";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MapCanvas />}></Route>
            </Routes>
        </Router>
    );
}

export default App;
