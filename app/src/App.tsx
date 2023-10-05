import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Loader from "./components/Loader";

const CreatePage = lazy(() => import("./pages/Create"));
const CollectPage = lazy(() => import("./pages/Collect"));

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<CreatePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/c" element={<CollectPage />} />
      </Routes>
    </Suspense>
  );
}
