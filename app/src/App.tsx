import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

const CreatePage = lazy(() => import("./pages/Create"));
const CollectPage = lazy(() => import("./pages/Collect"));
const PreCollectedPage = lazy(() => import("./pages/PreCollected"));

export default function App() {
  return (
    <Suspense fallback={<>Loading. . . </>}>
      <Routes>
        <Route path="/" element={<CreatePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/collect" element={<CollectPage />} />
        <Route path="/pre-collected" element={<PreCollectedPage />} />
      </Routes>
    </Suspense>
  );
}
