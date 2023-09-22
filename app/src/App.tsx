import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";

const CreatePage = lazy(() => import("./pages/Create"));
const PreCollectedPage = lazy(() => import("./pages/PreCollected"));

export default function App() {
  return (
    <Suspense fallback={<>Loading. . . </>}>
      <ToastContainer limit={2} />
      <Routes>
        <Route path="/" element={<CreatePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/pre-collected" element={<PreCollectedPage />} />
      </Routes>
    </Suspense>
  );
}
